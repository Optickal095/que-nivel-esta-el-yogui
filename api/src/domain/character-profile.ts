/**
 * Domain: the character as this app understands it.
 * Plain TypeScript, independent of Blizzard's JSON shape (the adapter translates).
 */

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
  slot: string; // stable key, e.g. 'CHEST'
  slotName: string; // localized, e.g. 'Torso'
  itemId: number;
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
  standing: string; // e.g. 'Amistoso'
  value: number;
  max: number;
}

export interface CharacterProfile {
  name: string;
  surname: string;
  level: number;
  experience: number;
  className: string;
  race: string;
  gender: string;
  faction: string;
  ruleset: string;
  guild: string | null;
  averageItemLevel: number;
  equippedItemLevel: number;
  lastLoginAt: Date;
  achievementPoints: number;
  honorableKills: number;
  questsCompleted: number;
  portraitUrl: string | null; // full-body render; Blizzard can take hours to produce it
  avatarUrl: string | null;
  equipment: EquippedItem[];
  stats: CharacterStats | null;
  professions: Profession[];
  reputations: Reputation[];
  funStats: FunStat[];
}

/** A curated in-game statistic (creatures killed, deaths...). */
export interface FunStat {
  id: number;
  label: string;
  value: number;
}
