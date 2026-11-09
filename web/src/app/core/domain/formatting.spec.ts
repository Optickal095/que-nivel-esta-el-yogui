import { EquippedItem } from './character.model';
import {
  classColor,
  duration,
  levelSinceText,
  presenceText,
  sortBySlot,
  timeAgo,
} from './formatting';

const now = new Date('2026-11-09T02:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms);

describe('timeAgo', () => {
  it('formats seconds, minutes, hours and days in Spanish', () => {
    expect(timeAgo(ago(10_000), now)).toBe('hace un momento');
    expect(timeAgo(ago(5 * 60_000), now)).toBe('hace 5 min');
    expect(timeAgo(ago(2 * 3_600_000), now)).toBe('hace 2 h');
    expect(timeAgo(ago(24 * 3_600_000), now)).toBe('hace 1 día');
    expect(timeAgo(ago(3 * 24 * 3_600_000), now)).toBe('hace 3 días');
  });

  it('never goes negative for future dates', () => {
    expect(timeAgo(new Date(now.getTime() + 60_000), now)).toBe('hace un momento');
  });
});

describe('duration', () => {
  it('shows the two most significant units', () => {
    expect(duration(30_000)).toBe('menos de 1 min');
    expect(duration(45 * 60_000)).toBe('45 min');
    expect(duration(3 * 3_600_000)).toBe('3 h');
    expect(duration(3 * 3_600_000 + 20 * 60_000)).toBe('3 h 20 min');
    expect(duration(24 * 3_600_000)).toBe('1 día');
    expect(duration(2 * 24 * 3_600_000 + 5 * 3_600_000 + 59 * 60_000)).toBe('2 días 5 h');
  });
});

describe('levelSinceText', () => {
  it('states an exact time at the level', () => {
    const text = levelSinceText({ at: ago(3 * 3_600_000), exact: true }, 11, now);
    expect(text).toEqual({ text: 'Lleva 3 h en nivel 11', note: null });
  });

  it('says "al menos" with a note when tracking started at that level', () => {
    const text = levelSinceText({ at: ago(90 * 60_000), exact: false }, 10, now)!;
    expect(text.text).toBe('Lleva al menos 1 h 30 min en nivel 10');
    expect(text.note).toContain('empezó a registrarlo');
  });

  it('is null without data', () => {
    expect(levelSinceText(null, 10, now)).toBeNull();
  });
});

describe('presenceText', () => {
  it('says online without detail', () => {
    expect(presenceText({ status: 'online', lastSeenAt: now, source: 'live' }, now)).toEqual({
      label: 'Conectado ahora',
      detail: null,
      tone: 'online',
    });
  });

  it('shows the last connection when unknown', () => {
    const text = presenceText({ status: 'unknown', lastSeenAt: ago(2 * 3_600_000), source: 'api' }, now);
    expect(text.label).toBe('Última conexión');
    expect(text.detail).toContain('hace 2 h');
  });

  it('says offline with last seen', () => {
    const text = presenceText({ status: 'offline', lastSeenAt: ago(5 * 60_000), source: 'live' }, now);
    expect(text.label).toBe('Desconectado');
    expect(text.detail).toContain('hace 5 min');
  });
});

describe('sortBySlot', () => {
  const item = (slot: string) => ({ slot }) as EquippedItem;

  it('orders like the character sheet, unknown slots last', () => {
    const sorted = sortBySlot([item('RANGED'), item('MYSTERY'), item('HEAD'), item('CHEST')]);
    expect(sorted.map((i) => i.slot)).toEqual(['HEAD', 'CHEST', 'RANGED', 'MYSTERY']);
  });
});

describe('classColor', () => {
  it('uses the in-game hunter color and falls back to gold', () => {
    expect(classColor('Cazador')).toBe('#AAD372');
    expect(classColor('Desconocido')).toBe('#f8b700');
  });
});
