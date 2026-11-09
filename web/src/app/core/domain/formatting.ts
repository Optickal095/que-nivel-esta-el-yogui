/** Pure display rules (no Angular): relative times, item colors, slot order. */
import {
  DeathsAtLevel,
  EquippedItem,
  ItemQuality,
  LevelSince,
} from './character.model';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "hace un momento", "hace 5 min", "hace 2 h", "hace 3 días". */
export function timeAgo(date: Date, now: Date): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  if (diff < MINUTE) return 'hace un momento';
  if (diff < HOUR) return `hace ${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `hace ${Math.floor(diff / HOUR)} h`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

/** Elapsed time, two most significant units: "45 min", "3 h 20 min", "2 días 5 h". */
export function duration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / MINUTE));
  const days = Math.floor(totalMin / (24 * 60));
  const hours = Math.floor((totalMin % (24 * 60)) / 60);
  const minutes = totalMin % 60;
  if (days > 0) {
    const d = days === 1 ? '1 día' : `${days} días`;
    return hours > 0 ? `${d} ${hours} h` : d;
  }
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return minutes > 0 ? `${minutes} min` : 'menos de 1 min';
}

export interface LevelSinceText {
  text: string; // "Lleva 3 h 20 min en nivel 10"
  note: string | null; // why it is a lower bound
}

/** Time at the current level. Real time, not /played (Blizzard does not expose it). */
export function levelSinceText(
  since: LevelSince | null,
  level: number,
  now: Date,
): LevelSinceText | null {
  if (!since) return null;
  const elapsed = duration(now.getTime() - since.at.getTime());
  return since.exact
    ? { text: `Lleva ${elapsed} en nivel ${level}`, note: null }
    : {
        // "al menos menos de 1 min" reads badly: drop the "al menos" there.
        text: `Lleva ${elapsed.startsWith('menos') ? '' : 'al menos '}${elapsed} en nivel ${level}`,
        note: `Contando desde que el sitio empezó a registrarlo (${shortDateTime(since.at)}).`,
      };
}

/** "8 nov, 21:07" in the visitor's time zone. */
/** "3 en nivel 13" / "3 en nivel 13 desde que se registró". null when unknown. */
export function deathsAtLevelText(deaths: DeathsAtLevel | null, level: number): string | null {
  if (!deaths) return null;
  const text = `${deaths.count} en nivel ${level}`;
  return deaths.exact ? text : `${text} desde que se registró`;
}

export function shortDateTime(date: Date): string {
  const day = date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '');
  const time = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

/** "hace 2 h (9 nov, 01:24 a. m.)": when the character last logged in. */
export function lastLoginText(lastLoginAt: Date, now: Date): string {
  return `${timeAgo(lastLoginAt, now)} (${shortDateTime(lastLoginAt)})`;
}

/** In-game item quality colors. */
export const QUALITY_COLORS: Record<ItemQuality, string> = {
  POOR: '#9d9d9d',
  COMMON: '#ffffff',
  UNCOMMON: '#1eff00',
  RARE: '#0070dd',
  EPIC: '#a335ee',
  LEGENDARY: '#ff8000',
  ARTIFACT: '#e6cc80',
  HEIRLOOM: '#00ccff',
};

/** In-game class colors, keyed by the Spanish class name the API returns (es_MX). */
const CLASS_COLORS: Record<string, string> = {
  Cazador: '#AAD372',
  Cazadora: '#AAD372',
  Guerrero: '#C69B6D',
  Guerrera: '#C69B6D',
  Paladín: '#F48CBA',
  Pícaro: '#FFF468',
  Pícara: '#FFF468',
  Sacerdote: '#FFFFFF',
  Sacerdotisa: '#FFFFFF',
  Chamán: '#0070DD',
  Mago: '#3FC7EB',
  Maga: '#3FC7EB',
  Brujo: '#8788EE',
  Bruja: '#8788EE',
  Druida: '#FF7C0A',
};

export function classColor(className: string): string {
  return CLASS_COLORS[className] ?? '#f8b700';
}

/** Character sheet order (head to weapons). */
const SLOT_ORDER = [
  'HEAD', 'NECK', 'SHOULDER', 'BACK', 'CHEST', 'SHIRT', 'TABARD', 'WRIST',
  'HANDS', 'WAIST', 'LEGS', 'FEET', 'FINGER_1', 'FINGER_2', 'TRINKET_1', 'TRINKET_2',
  'MAIN_HAND', 'OFF_HAND', 'RANGED', 'AMMO',
];

export function sortBySlot(items: EquippedItem[]): EquippedItem[] {
  const rank = (slot: string) => {
    const i = SLOT_ORDER.indexOf(slot);
    return i === -1 ? SLOT_ORDER.length : i;
  };
  return [...items].sort((a, b) => rank(a.slot) - rank(b.slot));
}
