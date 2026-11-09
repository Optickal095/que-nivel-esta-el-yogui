/**
 * Domain: level history. Blizzard only reports the current level, so the app
 * records every change it observes (from the API or from the live bridge).
 */

export type LevelSource = 'api' | 'live';

export interface LevelEvent {
  level: number;
  at: Date;
  source: LevelSource;
  /** Total deaths when this level was first recorded (baseline for "deaths at this level"). */
  deathsAtStart?: number | null;
}

/**
 * Decides whether an observed level must be recorded.
 * Levels never go down, so a lower value is stale data (e.g. the API lagging
 * behind a live update) and is ignored.
 */
export function shouldRecordLevel(
  lastRecorded: LevelEvent | null,
  observedLevel: number,
): boolean {
  if (!Number.isInteger(observedLevel) || observedLevel < 1) return false;
  return lastRecorded === null || observedLevel > lastRecorded.level;
}

export interface LevelSince {
  at: Date;
  /**
   * true  → we saw the previous level, so `at` is when it levelled up (± the refresh delay).
   * false → tracking started at this level: it has been at it *at least* since `at`.
   */
  exact: boolean;
}

/**
 * Since when the character has been at `level` (real time, not /played:
 * Blizzard does not expose played time). null if that level was never recorded.
 */
export function levelSince(
  events: LevelEvent[],
  level: number,
): LevelSince | null {
  const atLevel = events.filter((e) => e.level === level);
  if (atLevel.length === 0) return null;
  const reached = atLevel.reduce((a, b) => (a.at <= b.at ? a : b));
  const sawPrevious = events.some((e) => e.level < level && e.at <= reached.at);
  return { at: reached.at, exact: sawPrevious };
}

/** The highest recorded level event (levels only go up). */
export function highestLevelEvent(events: LevelEvent[]): LevelEvent | null {
  return events.reduce<LevelEvent | null>(
    (best, e) => (best === null || e.level > best.level ? e : best),
    null,
  );
}

/** Current level = the highest of what the API says and what was recorded live. */
export function currentLevel(
  apiLevel: number,
  lastRecorded: LevelEvent | null,
): number {
  return Math.max(apiLevel, lastRecorded?.level ?? 0);
}
