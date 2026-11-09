/** Pure geometry for the level-history step chart (no Angular, testable). */
import { LevelEvent } from './character.model';

export interface ChartGeometry {
  path: string; // SVG path of the step line
  points: { x: number; y: number; level: number; at: Date; source: 'api' | 'live' }[];
  yTicks: { y: number; level: number }[];
}

/**
 * Levels only go up, so the line steps: flat until the next level-up, then up.
 * The line extends to `now` so the last level reads as "still at this level".
 */
export function levelChartGeometry(
  events: LevelEvent[],
  now: Date,
  width: number,
  height: number,
  pad = 32,
): ChartGeometry | null {
  if (events.length === 0) return null;
  const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());

  const t0 = sorted[0].at.getTime();
  const t1 = Math.max(now.getTime(), sorted[sorted.length - 1].at.getTime() + 1);
  const minLevel = Math.max(1, sorted[0].level - 1);
  const maxLevel = sorted[sorted.length - 1].level + 1;

  const x = (t: number) => pad + ((t - t0) / (t1 - t0)) * (width - 2 * pad);
  const y = (level: number) => height - pad - ((level - minLevel) / (maxLevel - minLevel)) * (height - 2 * pad);

  const points = sorted.map((e) => ({ x: x(e.at.getTime()), y: y(e.level), level: e.level, at: e.at, source: e.source }));

  let path = `M${points[0].x},${points[0].y}`;
  for (const p of points.slice(1)) path += ` H${p.x} V${p.y}`;
  path += ` H${x(t1)}`;

  const step = Math.max(1, Math.ceil((maxLevel - minLevel) / 5));
  const yTicks = [];
  for (let level = minLevel; level <= maxLevel; level += step) yTicks.push({ y: y(level), level });

  return { path, points, yTicks };
}
