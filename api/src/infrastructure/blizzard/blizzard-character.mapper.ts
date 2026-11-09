import {
  CharacterProfile,
  CharacterStats,
  EquippedItem,
  FunStat,
  ItemQuality,
  Profession,
  Reputation,
} from '../../domain/character-profile';
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

/** Everything fetched for one character; sub-resources may be missing (null). */
export interface BlizzardCharacterBundle {
  profile: BlizzardProfile;
  equipment: BlizzardEquipment | null;
  statistics: BlizzardStatistics | null;
  media: BlizzardMedia | null;
  professions: BlizzardProfessions | null;
  reputations: BlizzardReputations | null;
  quests: BlizzardCompletedQuests | null;
  pvp: BlizzardPvpSummary | null;
  achievementStatistics: BlizzardAchievementStatistics | null;
  /** itemId → icon URL */
  icons: ReadonlyMap<number, string>;
}

const QUALITIES: ItemQuality[] = [
  'POOR',
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'ARTIFACT',
  'HEIRLOOM',
];

function toQuality(type: string): ItemQuality {
  return (QUALITIES as string[]).includes(type)
    ? (type as ItemQuality)
    : 'COMMON';
}

function round(n: number | undefined, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round((n ?? 0) * f) / f;
}

function mapItems(
  equipment: BlizzardEquipment | null,
  icons: ReadonlyMap<number, string>,
): EquippedItem[] {
  return (equipment?.equipped_items ?? []).map((i) => ({
    slot: i.slot.type,
    slotName: i.slot.name,
    itemId: i.item.id,
    name: i.name,
    quality: toQuality(i.quality.type),
    itemLevel: i.level?.value ?? 0,
    iconUrl: icons.get(i.item.id) ?? null,
    enchantments: (i.enchantments ?? []).map((e) => e.display_string),
  }));
}

function mapStats(s: BlizzardStatistics | null): CharacterStats | null {
  if (!s) return null;
  return {
    health: s.health,
    power: s.power,
    powerType: s.power_type.name,
    strength: s.strength.effective,
    agility: s.agility.effective,
    intellect: s.intellect.effective,
    stamina: s.stamina.effective,
    spirit: s.spirit?.effective ?? 0,
    armor: s.armor.effective,
    defense: s.defense?.effective ?? 0,
    attackPower: s.attack_power,
    rangedAttackPower: s.ranged_attack_power ?? 0,
    meleeCritPct: round(s.melee_crit.value),
    rangedCritPct: round(s.ranged_crit?.value),
    spellCritPct: round(s.spell_crit.value),
    dodgePct: round(s.dodge.value),
  };
}

function mapProfessions(p: BlizzardProfessions | null): Profession[] {
  return [...(p?.primaries ?? []), ...(p?.secondaries ?? [])].map((entry) => {
    const tier = entry.tiers?.[0];
    return {
      name: entry.profession.name,
      skill: tier?.skill_points ?? entry.skill_points ?? 0,
      maxSkill: tier?.max_skill_points ?? entry.max_skill_points ?? 0,
    };
  });
}

function mapReputations(r: BlizzardReputations | null): Reputation[] {
  return (r?.reputations ?? []).map((rep) => ({
    faction: rep.faction.name,
    standing: rep.standing.name,
    value: rep.standing.value,
    max: rep.standing.max,
  }));
}

/**
 * In-game statistics shown as "fun facts", by id (ids are stable across
 * locales; the label comes localized from the API). Order = display order.
 */
export const FUN_STAT_IDS = [
  107, // Criaturas muertas
  60, // Muertes propias
  1487, // Golpes de gracia
  347, // Comida consumida
  346, // Bebidas consumidas
  94, // Misiones abandonadas
  1745, // Recetas de cocina conocidas
  64222, // Campamentos realizados (Forever)
];

function mapFunStats(s: BlizzardAchievementStatistics | null): FunStat[] {
  const byId = new Map<number, FunStat>();
  for (const category of s?.categories ?? []) {
    const entries = [
      ...(category.statistics ?? []),
      ...(category.sub_categories ?? []).flatMap((sub) => sub.statistics ?? []),
    ];
    for (const e of entries) {
      byId.set(e.id, { id: e.id, label: e.name, value: e.quantity });
    }
  }
  return FUN_STAT_IDS.flatMap((id) => byId.get(id) ?? []);
}

function asset(media: BlizzardMedia | null, key: string): string | null {
  return media?.assets?.find((a) => a.key === key)?.value ?? null;
}

/** Pure translation from Blizzard's JSON to the domain model. */
export function mapBlizzardCharacter(
  b: BlizzardCharacterBundle,
): CharacterProfile {
  const p = b.profile;
  return {
    name: p.name,
    surname: p.surname,
    level: p.level,
    experience: p.experience,
    className: p.character_class.name,
    race: p.race.name,
    gender: p.gender.name,
    faction: p.faction.name,
    ruleset: p.ruleset?.name ?? '',
    guild: p.guild?.name ?? null,
    averageItemLevel: p.average_item_level,
    equippedItemLevel: p.equipped_item_level,
    lastLoginAt: new Date(p.last_login_timestamp),
    achievementPoints: p.achievement_points,
    honorableKills: b.pvp?.honorable_kills ?? 0,
    questsCompleted: b.quests?.quests.length ?? 0,
    portraitUrl: asset(b.media, 'main-raw') ?? asset(b.media, 'main'),
    avatarUrl: asset(b.media, 'avatar'),
    equipment: mapItems(b.equipment, b.icons),
    stats: mapStats(b.statistics),
    professions: mapProfessions(b.professions),
    reputations: mapReputations(b.reputations),
    funStats: mapFunStats(b.achievementStatistics),
  };
}
