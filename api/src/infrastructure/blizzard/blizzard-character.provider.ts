import { CharacterProfileProvider, Logger } from '../../application/ports';
import { CharacterProfile } from '../../domain/character-profile';
import { BlizzardApiClient, BlizzardNamespace } from './blizzard-api.client';
import { mapBlizzardCharacter } from './blizzard-character.mapper';
import {
  BlizzardAchievementStatistics,
  BlizzardCompletedQuests,
  BlizzardEquipment,
  BlizzardHunterPets,
  BlizzardMedia,
  BlizzardProfessions,
  BlizzardProfile,
  BlizzardPvpSummary,
  BlizzardReputations,
  BlizzardStatistics,
} from './blizzard-types';

/**
 * Adapter: implements CharacterProfileProvider with Blizzard's WoW Forever API.
 * The main profile is required; every sub-resource is optional so one failing
 * endpoint (e.g. the render, which takes hours to appear) never hides the rest.
 * Item icons and creature renders never change, so they are cached in memory.
 */
export class BlizzardCharacterProvider implements CharacterProfileProvider {
  private readonly iconCache = new Map<number, string>();
  private readonly creatureImageCache = new Map<number, string>();
  private readonly basePath: string;

  constructor(
    private readonly client: BlizzardApiClient,
    name: string,
    surname: string,
    private readonly logger: Logger,
  ) {
    // WoW Forever has no realms: a character is identified by name-surname.
    this.basePath = `/profile/wow/character/${encodeURIComponent(`${name}-${surname}`.toLowerCase())}`;
  }

  async fetchProfile(): Promise<CharacterProfile | null> {
    const profile = await this.client.get<BlizzardProfile>(
      this.basePath,
      'profile',
    );
    if (!profile) return null;

    const [
      equipment,
      statistics,
      media,
      professions,
      reputations,
      quests,
      pvp,
      achievementStatistics,
      hunterPets,
    ] = await Promise.all([
      this.optional<BlizzardEquipment>('/equipment'),
      this.optional<BlizzardStatistics>('/statistics'),
      this.optional<BlizzardMedia>('/character-media'),
      this.optional<BlizzardProfessions>('/professions'),
      this.optional<BlizzardReputations>('/reputations'),
      this.optional<BlizzardCompletedQuests>('/quests/completed'),
      this.optional<BlizzardPvpSummary>('/pvp-summary'),
      this.optional<BlizzardAchievementStatistics>('/achievements/statistics'),
      this.optional<BlizzardHunterPets>('/hunter-pets'),
    ]);

    await Promise.all([
      this.loadIcons(equipment?.equipped_items.map((i) => i.item.id) ?? []),
      this.loadCreatureImages(
        (hunterPets?.hunter_pets ?? []).flatMap((p) =>
          p.creature_display ? [p.creature_display.id] : [],
        ),
      ),
    ]);

    return mapBlizzardCharacter({
      profile,
      equipment,
      statistics,
      media,
      professions,
      reputations,
      quests,
      pvp,
      achievementStatistics,
      hunterPets,
      icons: this.iconCache,
      creatureImages: this.creatureImageCache,
    });
  }

  private async optional<T>(
    subPath: string,
    namespace: BlizzardNamespace = 'profile',
  ): Promise<T | null> {
    const path = subPath.startsWith('/data/')
      ? subPath
      : this.basePath + subPath;
    try {
      return await this.client.get<T>(path, namespace);
    } catch (error) {
      this.logger.warn(`Optional resource ${path} failed: ${String(error)}`);
      return null;
    }
  }

  private async loadIcons(itemIds: number[]): Promise<void> {
    const missing = [...new Set(itemIds)].filter(
      (id) => !this.iconCache.has(id),
    );
    await Promise.all(
      missing.map(async (id) => {
        const media = await this.optional<BlizzardMedia>(
          `/data/wow/media/item/${id}`,
          'static',
        );
        const icon = media?.assets?.find((a) => a.key === 'icon')?.value;
        if (icon) this.iconCache.set(id, icon);
      }),
    );
  }

  private async loadCreatureImages(displayIds: number[]): Promise<void> {
    const missing = [...new Set(displayIds)].filter(
      (id) => !this.creatureImageCache.has(id),
    );
    await Promise.all(
      missing.map(async (id) => {
        const media = await this.optional<BlizzardMedia>(
          `/data/wow/media/creature-display/${id}`,
          'static',
        );
        const image = media?.assets?.find((a) => a.key === 'zoom')?.value;
        if (image) this.creatureImageCache.set(id, image);
      }),
    );
  }
}
