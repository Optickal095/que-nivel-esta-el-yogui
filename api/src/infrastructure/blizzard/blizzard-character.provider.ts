import { CharacterProfileProvider, Logger } from '../../application/ports';
import { CharacterProfile } from '../../domain/character-profile';
import { BlizzardApiClient, BlizzardNamespace } from './blizzard-api.client';
import { mapBlizzardCharacter } from './blizzard-character.mapper';
import {
  BlizzardAchievementStatistics,
  BlizzardCompletedQuests,
  BlizzardEquipment,
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
 * Item icons never change, so they are cached in memory by item id.
 */
export class BlizzardCharacterProvider implements CharacterProfileProvider {
  private readonly iconCache = new Map<number, string>();
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
    ] = await Promise.all([
      this.optional<BlizzardEquipment>('/equipment'),
      this.optional<BlizzardStatistics>('/statistics'),
      this.optional<BlizzardMedia>('/character-media'),
      this.optional<BlizzardProfessions>('/professions'),
      this.optional<BlizzardReputations>('/reputations'),
      this.optional<BlizzardCompletedQuests>('/quests/completed'),
      this.optional<BlizzardPvpSummary>('/pvp-summary'),
      this.optional<BlizzardAchievementStatistics>('/achievements/statistics'),
    ]);

    await this.loadIcons(equipment?.equipped_items.map((i) => i.item.id) ?? []);

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
      icons: this.iconCache,
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
}
