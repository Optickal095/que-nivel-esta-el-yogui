import { CharacterProfile } from './character-profile';
import { DeathsAtLevel, deathsAtLevel } from './deaths';
import { LevelEvent, LevelSince, levelSince } from './level-history';

/**
 * Domain: everything the site shows: the last profile from Blizzard plus what
 * the app derives from the recorded level history.
 */
export interface CharacterOverview {
  profile: CharacterProfile;
  levelSince: LevelSince | null;
  deathsAtLevel: DeathsAtLevel | null;
  profileFetchedAt: Date;
}

export function buildOverview(
  profile: CharacterProfile,
  profileFetchedAt: Date,
  levelEvents: LevelEvent[],
): CharacterOverview {
  return {
    profile,
    levelSince: levelSince(levelEvents, profile.level),
    deathsAtLevel: deathsAtLevel(levelEvents, profile.level, profile.deaths),
    profileFetchedAt,
  };
}
