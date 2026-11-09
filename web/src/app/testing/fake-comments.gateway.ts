import { Observable, of, throwError } from 'rxjs';
import { CommentsGateway, ModerationKeyStore } from '../core/application/comments.gateway';
import { Comment, CommentDraft } from '../core/domain/comment.model';

/** Test double for the CommentsGateway port. */
export class FakeCommentsGateway implements CommentsGateway {
  comments: Comment[] = [
    { id: 1, author: 'Edu', body: '¡Vamos Yogui!', createdAt: new Date('2026-11-09T01:50:00Z') },
  ];
  validKey = 'admin-key';
  postError: Error | null = null;
  removed: number[] = [];

  list(): Observable<Comment[]> {
    return of(this.comments);
  }

  post(draft: CommentDraft): Observable<Comment> {
    if (this.postError) return throwError(() => this.postError);
    const comment = {
      id: this.comments.length + 1,
      author: draft.author.trim() || 'Anónimo',
      body: draft.body.trim(),
      createdAt: new Date('2026-11-09T02:00:00Z'),
    };
    return of(comment);
  }

  checkModerationKey(key: string): Observable<void> {
    return key === this.validKey ? of(undefined) : throwError(() => new Error('401'));
  }

  remove(id: number, key: string): Observable<void> {
    if (key !== this.validKey) return throwError(() => new Error('401'));
    this.removed.push(id);
    return of(undefined);
  }
}

export class MemoryModerationKeyStore implements ModerationKeyStore {
  constructor(public key: string | null = null) {}
  get(): string | null {
    return this.key;
  }
  set(key: string): void {
    this.key = key;
  }
  clear(): void {
    this.key = null;
  }
}
