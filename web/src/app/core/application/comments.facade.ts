import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Comment, CommentDraft } from '../domain/comment.model';
import { COMMENTS_GATEWAY, MODERATION_KEY_STORE } from './comments.gateway';

export const COMMENTS_REFRESH_MS = 60_000;

/**
 * Facade: the comments section's state as signals. Posting, moderation
 * (delete with Eduardo's key, remembered in the browser) and a periodic reload.
 */
@Injectable()
export class CommentsFacade {
  private readonly gateway = inject(COMMENTS_GATEWAY);
  private readonly keyStore = inject(MODERATION_KEY_STORE);

  readonly comments = signal<Comment[]>([]);
  readonly posting = signal(false);
  readonly error = signal<string | null>(null);
  /** Increments after each successful post (the form clears itself). */
  readonly posted = signal(0);
  readonly moderating = signal(false);

  constructor() {
    const timer = setInterval(() => this.load(), COMMENTS_REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    const savedKey = this.keyStore.get();
    if (savedKey) this.unlock(savedKey);
  }

  load(): void {
    this.gateway.list().subscribe({
      next: (comments) => this.comments.set(comments),
      error: () => undefined, // keep what is shown; the next reload retries
    });
  }

  post(draft: CommentDraft): void {
    if (this.posting()) return;
    this.posting.set(true);
    this.error.set(null);
    this.gateway.post(draft).subscribe({
      next: (comment) => {
        this.comments.update((list) => [comment, ...list]);
        this.posted.update((n) => n + 1);
        this.posting.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.posting.set(false);
      },
    });
  }

  unlock(key: string): void {
    this.gateway.checkModerationKey(key).subscribe({
      complete: () => {
        this.keyStore.set(key);
        this.moderating.set(true);
        this.error.set(null);
      },
      error: () => {
        this.keyStore.clear();
        this.moderating.set(false);
        this.error.set('Clave de moderación incorrecta.');
      },
    });
  }

  lock(): void {
    this.keyStore.clear();
    this.moderating.set(false);
  }

  remove(id: number): void {
    const key = this.keyStore.get();
    if (!key) return;
    this.gateway.remove(id, key).subscribe({
      complete: () => this.comments.update((list) => list.filter((c) => c.id !== id)),
      error: (e: Error) => this.error.set(e.message),
    });
  }
}
