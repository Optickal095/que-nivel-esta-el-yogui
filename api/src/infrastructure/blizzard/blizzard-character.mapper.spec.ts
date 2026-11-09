import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BlizzardCharacterBundle,
  mapBlizzardCharacter,
} from './blizzard-character.mapper';
import {
  BlizzardAchievementStatistics,
  BlizzardCompletedQuests,
  BlizzardEquipment,
  BlizzardProfessions,
  BlizzardProfile,
  BlizzardPvpSummary,
  BlizzardReputations,
  BlizzardStatistics,
} from './blizzard-types';

// Real responses for Dr Yogui captured by scripts/spike-blizzard.mjs (2026-11-08).
const fixture = <T>(name: string): T =>
  JSON.parse(
    readFileSync(
      join(__dirname, '../../../test/fixtures/blizzard', `${name}.json`),
      'utf8',
    ),
  ) as T;

const bundle = (): BlizzardCharacterBundle => ({
  profile: fixture<BlizzardProfile>('profile'),
  equipment: fixture<BlizzardEquipment>('equipment'),
  statistics: fixture<BlizzardStatistics>('statistics'),
  media: null,
  professions: fixture<BlizzardProfessions>('professions'),
  reputations: fixture<BlizzardReputations>('reputations'),
  quests: fixture<BlizzardCompletedQuests>('quests-completed'),
  pvp: fixture<BlizzardPvpSummary>('pvp-summary'),
  achievementStatistics: fixture<BlizzardAchievementStatistics>(
    'achievement-statistics',
  ),
  icons: new Map([
    [4577, 'https://render.worldofwarcraft.com/forever-us/icons/56/135612.jpg'],
  ]),
});

describe('mapBlizzardCharacter (real fixtures)', () => {
  const profile = mapBlizzardCharacter(bundle());

  it('maps identity and progress', () => {
    expect(profile).toMatchObject({
      name: 'Dr',
      surname: 'Yogui',
      level: 10,
      className: 'Cazador',
      race: 'Tauren',
      faction: 'Horda',
      ruleset: 'JcJ',
      guild: null,
      equippedItemLevel: 4,
      questsCompleted: 41,
      honorableKills: 0,
    });
    expect(profile.lastLoginAt.getTime()).toBe(1794182839000);
  });

  it('maps equipment with quality, item level and cached icons', () => {
    expect(profile.equipment).toHaveLength(10);
    expect(profile.equipment.find((i) => i.slot === 'RANGED')).toEqual({
      slot: 'RANGED',
      slotName: 'A distancia',
      itemId: 4577,
      name: 'Escopeta compacta',
      quality: 'UNCOMMON',
      itemLevel: 13,
      iconUrl:
        'https://render.worldofwarcraft.com/forever-us/icons/56/135612.jpg',
      enchantments: [],
    });
    expect(
      profile.equipment.find((i) => i.slot === 'CHEST')?.iconUrl,
    ).toBeNull();
  });

  it('maps stats, professions and reputations', () => {
    expect(profile.stats).toMatchObject({
      health: 261,
      power: 226,
      powerType: 'Maná',
      agility: 31,
      stamina: 32,
    });
    expect(profile.professions).toEqual([
      { name: 'Herbalism', skill: 3, maxSkill: 75 },
      { name: 'Cooking', skill: 1, maxSkill: 75 },
    ]);
    expect(profile.reputations[0]).toEqual({
      faction: 'Cima del Trueno',
      standing: 'Amistoso',
      value: 3230,
      max: 6000,
    });
  });

  it('picks the curated fun stats in display order, from nested categories', () => {
    expect(profile.funStats.slice(0, 2)).toEqual([
      { id: 107, label: 'Criaturas muertas', value: 393 },
      { id: 1487, label: 'Golpes de gracia', value: 300 },
    ]);
    expect(profile.funStats.map((s) => s.id)).toContain(64222);
  });

  it('takes the total deaths out of the fun stats', () => {
    expect(profile.deaths).toBe(24);
    expect(profile.funStats.map((s) => s.id)).not.toContain(60);
  });

  it('has no fun stats nor deaths when the endpoint failed', () => {
    const p = mapBlizzardCharacter({
      ...bundle(),
      achievementStatistics: null,
    });
    expect(p.funStats).toEqual([]);
    expect(p.deaths).toBeNull();
  });

  it('has no portrait until Blizzard renders it', () => {
    expect(profile.portraitUrl).toBeNull();
    const withMedia = mapBlizzardCharacter({
      ...bundle(),
      media: {
        assets: [
          { key: 'main-raw', value: 'https://render/x.png' },
          { key: 'avatar', value: 'https://render/a.jpg' },
        ],
      },
    });
    expect(withMedia.portraitUrl).toBe('https://render/x.png');
    expect(withMedia.avatarUrl).toBe('https://render/a.jpg');
  });
});
