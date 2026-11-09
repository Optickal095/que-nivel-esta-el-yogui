import { shouldRecordLevel } from '../domain/level-history';
import { InvalidLiveUpdateError } from './errors';
import { Clock, LevelHistoryStore, LiveSignalStore } from './ports';

export interface LiveUpdateInput {
  online: boolean;
  level: number | null;
  /** When the addon saw it; defaults to now. Future timestamps are clamped to now. */
  observedAt?: Date;
}

/**
 * Use case (phase 2): the bridge reports what Eduardo's addon sees in the
 * friends list. Saves presence and records a level-up when the level grew.
 */
export class RecordLiveUpdate {
  constructor(
    private readonly live: LiveSignalStore,
    private readonly history: LevelHistoryStore,
    private readonly clock: Clock,
  ) {}

  async execute(input: LiveUpdateInput): Promise<void> {
    if (
      input.level !== null &&
      (!Number.isInteger(input.level) || input.level < 1 || input.level > 200)
    ) {
      throw new InvalidLiveUpdateError(`invalid level: ${input.level}`);
    }

    const now = this.clock.now();
    const observedAt =
      input.observedAt && input.observedAt.getTime() < now.getTime()
        ? input.observedAt
        : now;

    await this.live.saveLiveSignal({
      online: input.online,
      level: input.level,
      observedAt,
    });

    if (input.level !== null) {
      const last = await this.history.getLastLevelEvent();
      if (shouldRecordLevel(last, input.level)) {
        await this.history.addLevelEvent({
          level: input.level,
          at: observedAt,
          source: 'live',
        });
      }
    }
  }
}
