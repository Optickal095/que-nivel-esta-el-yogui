import { LevelEvent } from '../domain/level-history';
import { LevelHistoryStore } from './ports';

/** Use case: every level change recorded, oldest first (for the chart). */
export class GetLevelHistory {
  constructor(private readonly history: LevelHistoryStore) {}

  async execute(): Promise<LevelEvent[]> {
    const events = await this.history.getLevelEvents();
    return [...events].sort((a, b) => a.at.getTime() - b.at.getTime());
  }
}
