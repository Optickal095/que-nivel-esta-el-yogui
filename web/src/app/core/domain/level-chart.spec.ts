import { levelChartGeometry } from './level-chart';

const now = new Date('2026-11-10T00:00:00Z');

describe('levelChartGeometry', () => {
  it('returns null without events', () => {
    expect(levelChartGeometry([], now, 720, 220)).toBeNull();
  });

  it('draws a step line that goes up at each level and extends to now', () => {
    const g = levelChartGeometry(
      [
        { level: 11, at: new Date('2026-11-09T12:00:00Z'), source: 'live' },
        { level: 10, at: new Date('2026-11-09T00:00:00Z'), source: 'api' },
      ],
      now,
      720,
      220,
    )!;

    expect(g.points.map((p) => p.level)).toEqual([10, 11]); // sorted by time
    expect(g.points[1].y).toBeLessThan(g.points[0].y); // higher level = higher on screen
    expect(g.path).toMatch(/^M\S+ H\S+ V\S+ H688$/); // start, flat, up, flat to now (720 - 32)
  });

  it('works with a single event', () => {
    const g = levelChartGeometry([{ level: 10, at: new Date('2026-11-09T00:00:00Z'), source: 'api' }], now, 720, 220);
    expect(g?.points.length).toBe(1);
    expect(g?.yTicks.length).toBeGreaterThan(0);
  });
});
