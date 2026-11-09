import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment, CommentDraft } from '../domain/comment.model';

/**
 * Port: comments API. Errors come out as Error with a message fit to show
 * the visitor (the adapter translates HTTP errors).
 */
export interface CommentsGateway {
  list(): Observable<Comment[]>;
  post(draft: CommentDraft): Observable<Comment>;
  /** Completes when the key is valid; errors otherwise. */
  checkModerationKey(key: string): Observable<void>;
  remove(id: number, key: string): Observable<void>;
}

export const COMMENTS_GATEWAY = new InjectionToken<CommentsGateway>('CommentsGateway');

/** Port: where the moderation key is remembered between visits. */
export interface ModerationKeyStore {
  get(): string | null;
  set(key: string): void;
  clear(): void;
}

export const MODERATION_KEY_STORE = new InjectionToken<ModerationKeyStore>(
  'ModerationKeyStore',
);
