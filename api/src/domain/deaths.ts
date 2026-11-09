/**
 * Domain: deaths at the current level. Blizzard only reports the total, so
 * each level event keeps the total seen when that level was first recorded
 * (the baseline) and the count at the level is the difference.
 */
import { LevelEvent, levelSince } from './level-history';

export interface DeathsAtLevel {
  count: number;
  /**
   * false → the baseline was taken after the level-up (tracking started at
   * this level, or the profile only updated at logout): it is a lower bound.
   */
  exact: boolean;
}

export function deathsAtLevel(
  events: LevelEvent[],
  level: number,
  totalDeaths: number | null,
): DeathsAtLevel | null {
  if (totalDeaths === null) return null;
  const since = levelSince(events, level);
  if (!since) return null;
  const start = events.find(
    (e) => e.level === level && e.at.getTime() === since.at.getTime(),
  );
  if (start?.deathsAtStart == null) return null;
  return {
    count: Math.max(0, totalDeaths - start.deathsAtStart),
    exact: since.exact,
  };
}

/**
 * The level event that still lacks a deaths baseline and can take it now
 * (e.g. a level-up first seen live, or recorded before deaths were tracked).
 */
export function needsDeathsBaseline(
  last: LevelEvent | null,
  profileLevel: number,
  totalDeaths: number | null,
): boolean {
  return (
    last !== null &&
    last.level === profileLevel &&
    last.deathsAtStart == null &&
    totalDeaths !== null
  );
}
