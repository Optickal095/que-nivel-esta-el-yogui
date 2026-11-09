/**
 * Subset of Blizzard's WoW Forever profile API responses that the app uses.
 * The API is undocumented; these shapes come from real responses (test/fixtures/blizzard).
 */

interface Named {
  name: string;
}
interface Typed {
  type: string;
  name: string;
}
interface BaseEffective {
  base: number;
  effective: number;
}
interface Rated {
  value: number;
}

export interface BlizzardProfile {
  name: string;
  surname: string;
  level: number;
  faction: Typed;
  race: Named;
  character_class: Named;
  ruleset?: Named;
  guild?: Named;
  last_login_timestamp: number;
  equipped_item_level: number;
  achievement_points: number;
}

export interface BlizzardEquippedItem {
  item: { id: number };
  slot: Typed;
  quality: Typed;
  name: string;
  level?: { value: number };
  enchantments?: { display_string: string }[] | null;
}

export interface BlizzardEquipment {
  equipped_items: BlizzardEquippedItem[];
}

export interface BlizzardStatistics {
  health: number;
  power: number;
  power_type: Named;
  strength: BaseEffective;
  agility: BaseEffective;
  intellect: BaseEffective;
  stamina: BaseEffective;
  spirit?: BaseEffective;
  armor: BaseEffective;
  defense?: BaseEffective;
  attack_power: number;
  ranged_attack_power?: number;
  melee_crit: Rated;
  ranged_crit?: Rated;
  spell_crit: Rated;
  dodge: Rated;
}

export interface BlizzardMedia {
  assets?: { key: string; value: string }[];
}

interface BlizzardProfessionEntry {
  profession: Named;
  tiers?: { skill_points: number; max_skill_points: number }[];
  skill_points?: number;
  max_skill_points?: number;
}

export interface BlizzardProfessions {
  primaries?: BlizzardProfessionEntry[];
  secondaries?: BlizzardProfessionEntry[];
}

export interface BlizzardReputations {
  reputations: {
    faction: Named;
    standing: { value: number; max: number; name: string };
  }[];
}

export interface BlizzardCompletedQuests {
  quests: unknown[];
}

export interface BlizzardPvpSummary {
  honorable_kills?: number;
}

interface BlizzardStatisticEntry {
  id: number;
  name: string;
  quantity: number;
}

export interface BlizzardAchievementStatistics {
  categories?: {
    statistics?: BlizzardStatisticEntry[];
    sub_categories?: { statistics?: BlizzardStatisticEntry[] }[];
  }[];
}

export interface BlizzardTokenResponse {
  access_token: string;
  expires_in: number;
}
