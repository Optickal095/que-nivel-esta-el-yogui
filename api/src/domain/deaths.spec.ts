import { deathsAtLevel, needsDeathsBaseline } from './deaths';
import { LevelEvent } from './level-history';

const at = (iso: string) => new Date(iso);

describe('deathsAtLevel', () => {
  const events: LevelEvent[] = [
    {
      level: 10,
      at: at('2026-11-09T01:00:00Z'),
      deathsAtStart: 20,
    },
    {
      level: 11,
      at: at('2026-11-09T02:00:00Z'),
      deathsAtStart: 24,
    },
  ];

  it('is the total minus the baseline of the level', () => {
    expect(deathsAtLevel(events, 11, 27)).toEqual({ count: 3, exact: true });
  });

  it('is a lower bound when tracking started at that level', () => {
    expect(deathsAtLevel(events, 10, 22)).toEqual({ count: 2, exact: false });
  });

  it('is unknown without baseline, without total or for an unseen level', () => {
    const noBaseline: LevelEvent[] = [
      { level: 12, at: at('2026-11-09T03:00:00Z') },
    ];
    expect(deathsAtLevel(noBaseline, 12, 30)).toBeNull();
    expect(deathsAtLevel(events, 11, null)).toBeNull();
    expect(deathsAtLevel(events, 15, 30)).toBeNull();
  });

  it('never goes negative', () => {
    expect(deathsAtLevel(events, 11, 10)?.count).toBe(0);
  });
});

describe('needsDeathsBaseline', () => {
  const noBaseline: LevelEvent = {
    level: 12,
    at: at('2026-11-09T03:00:00Z'),
  };

  it('fills the baseline of the current level when it is missing', () => {
    expect(needsDeathsBaseline(noBaseline, 12, 30)).toBe(true);
  });

  it('does nothing when it already has one, for another level or without deaths', () => {
    expect(
      needsDeathsBaseline({ ...noBaseline, deathsAtStart: 25 }, 12, 30),
    ).toBe(false);
    expect(needsDeathsBaseline(noBaseline, 11, 30)).toBe(false);
    expect(needsDeathsBaseline(noBaseline, 12, null)).toBe(false);
    expect(needsDeathsBaseline(null, 12, 30)).toBe(false);
  });
});
