import { CharacterProfile } from './character-profile';
import { DeathsAtLevel, deathsAtLevel } from './deaths';
import {
  LevelEvent,
  LevelSince,
  currentLevel,
  highestLevelEvent,
  levelSince,
} from './level-history';
import { LiveSignal, Presence, resolvePresence } from './presence';

/**
 * Domain: everything the site shows, combining the last API snapshot with the
 * live data. The level shown is the freshest known (live can be ahead of the API).
 */
export interface CharacterOverview {
  profile: CharacterProfile;
  level: number;
  levelSince: LevelSince | null;
  deathsAtLevel: DeathsAtLevel | null;
  presence: Presence;
  profileFetchedAt: Date;
}

export function buildOverview(
  profile: CharacterProfile,
  profileFetchedAt: Date,
  levelEvents: LevelEvent[],
  live: LiveSignal | null,
  now: Date,
): CharacterOverview {
  const level = currentLevel(profile.level, highestLevelEvent(levelEvents));
  return {
    profile,
    level,
    levelSince: levelSince(levelEvents, level),
    deathsAtLevel: deathsAtLevel(levelEvents, level, profile.deaths),
    presence: resolvePresence(profile.lastLoginAt, live, now),
    profileFetchedAt,
  };
}
