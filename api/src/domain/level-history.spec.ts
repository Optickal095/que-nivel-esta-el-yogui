import {
  currentLevel,
  highestLevelEvent,
  levelSince,
  shouldRecordLevel,
} from './level-history';

const event = (level: number) => ({
  level,
  at: new Date('2026-11-01T00:00:00Z'),
  source: 'api' as const,
});

describe('shouldRecordLevel', () => {
  it('records the first level ever seen', () => {
    expect(shouldRecordLevel(null, 10)).toBe(true);
  });

  it('records a level-up', () => {
    expect(shouldRecordLevel(event(10), 11)).toBe(true);
  });

  it('ignores the same level and stale lower levels', () => {
    expect(shouldRecordLevel(event(11), 11)).toBe(false);
    expect(shouldRecordLevel(event(11), 10)).toBe(false);
  });

  it('ignores invalid levels', () => {
    expect(shouldRecordLevel(null, 0)).toBe(false);
    expect(shouldRecordLevel(null, 10.5)).toBe(false);
  });
});

describe('levelSince', () => {
  const at = (iso: string, level: number) => ({
    level,
    at: new Date(iso),
    source: 'api' as const,
  });

  it('is exact when the previous level was seen', () => {
    const events = [
      at('2026-11-08T00:00:00Z', 10),
      at('2026-11-09T05:00:00Z', 11),
    ];
    expect(levelSince(events, 11)).toEqual({
      at: new Date('2026-11-09T05:00:00Z'),
      exact: true,
    });
  });

  it('is a lower bound when tracking started at that level', () => {
    expect(levelSince([at('2026-11-08T00:00:00Z', 10)], 10)).toEqual({
      at: new Date('2026-11-08T00:00:00Z'),
      exact: false,
    });
  });

  it('is null when the level was never recorded', () => {
    expect(levelSince([at('2026-11-08T00:00:00Z', 10)], 12)).toBeNull();
  });
});

describe('highestLevelEvent', () => {
  it('returns the highest level, or null when empty', () => {
    expect(highestLevelEvent([event(10), event(12), event(11)])?.level).toBe(
      12,
    );
    expect(highestLevelEvent([])).toBeNull();
  });
});

describe('currentLevel', () => {
  it('is the highest of the API level and the recorded one', () => {
    expect(currentLevel(10, null)).toBe(10);
    expect(currentLevel(10, event(12))).toBe(12);
    expect(currentLevel(13, event(12))).toBe(13);
  });
});
