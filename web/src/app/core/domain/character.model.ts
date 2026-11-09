/** Front-end domain model: what the page shows. Dates are real Dates (the gateway parses them). */

export type ItemQuality =
  | 'POOR'
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'ARTIFACT'
  | 'HEIRLOOM';

export interface EquippedItem {
  slot: string;
  slotName: string;
  name: string;
  quality: ItemQuality;
  itemLevel: number;
  iconUrl: string | null;
  enchantments: string[];
}

export interface CharacterStats {
  health: number;
  power: number;
  powerType: string;
  strength: number;
  agility: number;
  intellect: number;
  stamina: number;
  spirit: number;
  armor: number;
  defense: number;
  attackPower: number;
  rangedAttackPower: number;
  meleeCritPct: number;
  rangedCritPct: number;
  spellCritPct: number;
  dodgePct: number;
}

export interface Profession {
  name: string;
  skill: number;
  maxSkill: number;
}

export interface Reputation {
  faction: string;
  standing: string;
  value: number;
  max: number;
}

export interface HunterPet {
  name: string;
  level: number;
  /** Species, e.g. 'Acechador de pradera'. */
  creature: string;
  imageUrl: string | null;
  active: boolean;
}

export interface FunStat {
  id: number;
  label: string;
  value: number;
}

/** Since when the character is at its current level (real time, not /played). */
export interface LevelSince {
  at: Date;
  /** false = tracking started at this level, so it is a lower bound. */
  exact: boolean;
}

/** Deaths since the current level was recorded. */
export interface DeathsAtLevel {
  count: number;
  /** false = counted from when the site saw the level, so it is a lower bound. */
  exact: boolean;
}

export interface CharacterOverview {
  name: string;
  surname: string;
  level: number;
  className: string;
  race: string;
  faction: string;
  ruleset: string;
  guild: string | null;
  equippedItemLevel: number;
  lastLoginAt: Date;
  achievementPoints: number;
  honorableKills: number;
  questsCompleted: number;
  /** Total deaths; null when Blizzard does not report it. */
  deaths: number | null;
  deathsAtLevel: DeathsAtLevel | null;
  portraitUrl: string | null;
  equipment: EquippedItem[];
  stats: CharacterStats | null;
  professions: Profession[];
  reputations: Reputation[];
  funStats: FunStat[];
  /** Empty for classes without pets. Active one first. */
  hunterPets: HunterPet[];
  levelSince: LevelSince | null;
  profileFetchedAt: Date;
}

export interface LevelEvent {
  level: number;
  at: Date;
}
