import { CharacterOverview } from '../domain/character-overview';
import { LevelEvent } from '../domain/level-history';

/** HTTP response shape. Dates go out as ISO strings; the web app owns how to display them. */
export function toOverviewDto(o: CharacterOverview) {
  const { lastLoginAt, ...profile } = o.profile;
  return {
    ...profile,
    level: o.level, // freshest known (may be ahead of the API thanks to live data)
    apiLevel: o.profile.level,
    lastLoginAt: lastLoginAt.toISOString(),
    // Real time at the current level (Blizzard does not expose /played).
    levelSince: o.levelSince && {
      at: o.levelSince.at.toISOString(),
      exact: o.levelSince.exact,
    },
    presence: {
      status: o.presence.status,
      lastSeenAt: o.presence.lastSeenAt?.toISOString() ?? null,
      source: o.presence.source,
    },
    profileFetchedAt: o.profileFetchedAt.toISOString(),
  };
}

export function toLevelEventDto(e: LevelEvent) {
  return { level: e.level, at: e.at.toISOString(), source: e.source };
}
