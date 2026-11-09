/** Test doubles for the application ports (no framework, no network, no database). */
import {
  CharacterProfileProvider,
  Clock,
  LevelHistoryStore,
  LiveSignalStore,
  Logger,
  ProfileSnapshotStore,
  StoredProfile,
} from '../src/application/ports';
import { CharacterProfile } from '../src/domain/character-profile';
import { LevelEvent } from '../src/domain/level-history';
import { LiveSignal } from '../src/domain/presence';

export function aProfile(
  overrides: Partial<CharacterProfile> = {},
): CharacterProfile {
  return {
    name: 'Dr',
    surname: 'Yogui',
    level: 10,
    experience: 3875,
    className: 'Cazador',
    race: 'Tauren',
    gender: 'Masculino',
    faction: 'Horda',
    ruleset: 'JcJ',
    guild: null,
    averageItemLevel: 4,
    equippedItemLevel: 4,
    lastLoginAt: new Date('2026-11-09T00:07:19Z'),
    achievementPoints: 0,
    honorableKills: 0,
    questsCompleted: 41,
    portraitUrl: null,
    avatarUrl: null,
    equipment: [],
    stats: null,
    professions: [],
    reputations: [],
    funStats: [],
    ...overrides,
  };
}

export class FakeClock implements Clock {
  constructor(public current: Date) {}
  now(): Date {
    return this.current;
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class FakeProvider implements CharacterProfileProvider {
  calls = 0;
  constructor(
    public result: CharacterProfile | null | Error,
    private readonly delayMs = 0,
  ) {}
  async fetchProfile(): Promise<CharacterProfile | null> {
    this.calls++;
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

/** In-memory implementation of the three storage ports. */
export class InMemoryStore
  implements ProfileSnapshotStore, LevelHistoryStore, LiveSignalStore
{
  snapshot: StoredProfile | null = null;
  events: LevelEvent[] = [];
  live: LiveSignal | null = null;

  getSnapshot() {
    return Promise.resolve(this.snapshot);
  }
  saveSnapshot(s: StoredProfile) {
    this.snapshot = s;
    return Promise.resolve();
  }
  getLastLevelEvent() {
    const last = [...this.events].sort((a, b) => b.level - a.level)[0] ?? null;
    return Promise.resolve(last);
  }
  getLevelEvents() {
    return Promise.resolve([...this.events]);
  }
  addLevelEvent(e: LevelEvent) {
    this.events.push(e);
    return Promise.resolve();
  }
  getLiveSignal() {
    return Promise.resolve(this.live);
  }
  saveLiveSignal(s: LiveSignal) {
    this.live = s;
    return Promise.resolve();
  }
}

export class SilentLogger implements Logger {
  messages: string[] = [];
  warn(message: string): void {
    this.messages.push(message);
  }
}
