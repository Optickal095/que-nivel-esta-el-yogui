/** Test doubles for the application ports (no framework, no network, no database). */
import {
  CharacterProfileProvider,
  Clock,
  CommentStore,
  LevelHistoryStore,
  LiveSignalStore,
  Logger,
  ProfileSnapshotStore,
  StoredProfile,
} from '../src/application/ports';
import { CharacterProfile } from '../src/domain/character-profile';
import { Comment, CommentDraft } from '../src/domain/comment';
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
    deaths: 24,
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
  setDeathsAtStart(level: number, deaths: number) {
    for (const e of this.events)
      if (e.level === level && e.deathsAtStart == null)
        e.deathsAtStart = deaths;
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

/** In-memory CommentStore. */
export class InMemoryCommentStore implements CommentStore {
  rows: (Comment & { clientKey: string })[] = [];
  private nextId = 1;

  listComments(limit: number) {
    const newest = [...this.rows]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return Promise.resolve(
      newest.map((r) => ({
        id: r.id,
        author: r.author,
        body: r.body,
        createdAt: r.createdAt,
      })),
    );
  }
  addComment(draft: CommentDraft, createdAt: Date, clientKey: string) {
    const comment = { id: this.nextId++, ...draft, createdAt };
    this.rows.push({ ...comment, clientKey });
    return Promise.resolve(comment);
  }
  deleteComment(id: number) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => r.id !== id);
    return Promise.resolve(this.rows.length < before);
  }
  lastCommentAt(clientKey: string) {
    const mine = this.rows.filter((r) => r.clientKey === clientKey);
    const last = mine.reduce<Date | null>(
      (max, r) => (max === null || r.createdAt > max ? r.createdAt : max),
      null,
    );
    return Promise.resolve(last);
  }
}
