/**
 * Application ports: what the use cases need from the outside world.
 * Small, consumer-specific interfaces (ISP); infrastructure implements them.
 */
import { CharacterProfile } from '../domain/character-profile';
import { Comment, CommentDraft } from '../domain/comment';
import { LevelEvent } from '../domain/level-history';
import { LiveSignal } from '../domain/presence';

/** Source of truth for the character's profile (Blizzard's API). */
export interface CharacterProfileProvider {
  /** null when the character does not exist (yet) for the provider. Throws on transport errors. */
  fetchProfile(): Promise<CharacterProfile | null>;
}

export interface StoredProfile {
  profile: CharacterProfile;
  fetchedAt: Date;
}

export interface ProfileSnapshotStore {
  getSnapshot(): Promise<StoredProfile | null>;
  saveSnapshot(snapshot: StoredProfile): Promise<void>;
}

export interface LevelHistoryStore {
  getLastLevelEvent(): Promise<LevelEvent | null>;
  getLevelEvents(): Promise<LevelEvent[]>;
  addLevelEvent(event: LevelEvent): Promise<void>;
  /** Sets the deaths baseline of `level` if it has none yet. */
  setDeathsAtStart(level: number, deaths: number): Promise<void>;
}

export interface LiveSignalStore {
  getLiveSignal(): Promise<LiveSignal | null>;
  saveLiveSignal(signal: LiveSignal): Promise<void>;
}

export interface CommentStore {
  /** Newest first. */
  listComments(limit: number): Promise<Comment[]>;
  addComment(
    draft: CommentDraft,
    createdAt: Date,
    clientKey: string,
  ): Promise<Comment>;
  /** false when it did not exist. */
  deleteComment(id: number): Promise<boolean>;
  /** When this client last commented (for the anti-spam cooldown). */
  lastCommentAt(clientKey: string): Promise<Date | null>;
}

export interface Clock {
  now(): Date;
}

export interface Logger {
  warn(message: string): void;
}

// DI tokens (used by the Nest module to inject the implementations).
export const CHARACTER_PROFILE_PROVIDER = Symbol('CharacterProfileProvider');
export const PROFILE_SNAPSHOT_STORE = Symbol('ProfileSnapshotStore');
export const LEVEL_HISTORY_STORE = Symbol('LevelHistoryStore');
export const LIVE_SIGNAL_STORE = Symbol('LiveSignalStore');
export const COMMENT_STORE = Symbol('CommentStore');
export const CLOCK = Symbol('Clock');
