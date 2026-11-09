import { levelSince, shouldRecordLevel } from './level-history';

const event = (level: number) => ({
  level,
  at: new Date('2026-11-01T00:00:00Z'),
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
