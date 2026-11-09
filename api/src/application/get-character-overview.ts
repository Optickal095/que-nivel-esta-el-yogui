import { CharacterOverview, buildOverview } from '../domain/character-overview';
import { shouldRecordLevel } from '../domain/level-history';
import { CharacterUnavailableError } from './errors';
import {
  CharacterProfileProvider,
  Clock,
  LevelHistoryStore,
  LiveSignalStore,
  Logger,
  ProfileSnapshotStore,
  StoredProfile,
} from './ports';

export const PROFILE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Use case: what the site shows.
 * Serves the stored snapshot and refreshes it from the provider when it is older
 * than PROFILE_MAX_AGE_MS (cache-aside). If the provider fails, the last good
 * snapshot is kept. Concurrent requests share a single refresh.
 */
export class GetCharacterOverview {
  private refreshing: Promise<StoredProfile | null> | null = null;

  constructor(
    private readonly provider: CharacterProfileProvider,
    private readonly snapshots: ProfileSnapshotStore,
    private readonly history: LevelHistoryStore,
    private readonly live: LiveSignalStore,
    private readonly clock: Clock,
    private readonly logger: Logger,
    private readonly maxAgeMs: number = PROFILE_MAX_AGE_MS,
  ) {}

  async execute(): Promise<CharacterOverview> {
    let snapshot = await this.snapshots.getSnapshot();

    if (!snapshot || this.isStale(snapshot)) {
      snapshot = (await this.refreshOnce()) ?? snapshot;
    }
    if (!snapshot) {
      throw new CharacterUnavailableError(
        'the API has not returned the character yet',
      );
    }

    const [levelEvents, liveSignal] = await Promise.all([
      this.history.getLevelEvents(),
      this.live.getLiveSignal(),
    ]);
    return buildOverview(
      snapshot.profile,
      snapshot.fetchedAt,
      levelEvents,
      liveSignal,
      this.clock.now(),
    );
  }

  private isStale(snapshot: StoredProfile): boolean {
    return (
      this.clock.now().getTime() - snapshot.fetchedAt.getTime() > this.maxAgeMs
    );
  }

  private refreshOnce(): Promise<StoredProfile | null> {
    this.refreshing ??= this.refresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async refresh(): Promise<StoredProfile | null> {
    try {
      const profile = await this.provider.fetchProfile();
      if (!profile) return null;

      const snapshot: StoredProfile = { profile, fetchedAt: this.clock.now() };
      await this.snapshots.saveSnapshot(snapshot);

      const last = await this.history.getLastLevelEvent();
      if (shouldRecordLevel(last, profile.level)) {
        await this.history.addLevelEvent({
          level: profile.level,
          at: snapshot.fetchedAt,
          source: 'api',
        });
      }
      return snapshot;
    } catch (error) {
      this.logger.warn(
        `Profile refresh failed, keeping last snapshot: ${String(error)}`,
      );
      return null;
    }
  }
}
