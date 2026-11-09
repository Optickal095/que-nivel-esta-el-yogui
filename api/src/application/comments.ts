/**
 * Use cases for visitors' comments: list, post (validated + per-client
 * cooldown) and delete (moderation; the guard in front checks the admin key).
 */
import { Comment, canCommentAgain, validateComment } from '../domain/comment';
import {
  CommentNotFoundError,
  CommentRateLimitedError,
  InvalidCommentError,
} from './errors';
import { Clock, CommentStore } from './ports';

export const COMMENTS_PAGE_SIZE = 100;

export class ListComments {
  constructor(private readonly store: CommentStore) {}

  execute(): Promise<Comment[]> {
    return this.store.listComments(COMMENTS_PAGE_SIZE);
  }
}

export interface PostCommentInput {
  author: string;
  body: string;
  /** Opaque, non-reversible id of the visitor (hash of the IP), for the cooldown. */
  clientKey: string;
}

export class PostComment {
  constructor(
    private readonly store: CommentStore,
    private readonly clock: Clock,
  ) {}

  async execute(input: PostCommentInput): Promise<Comment> {
    const result = validateComment(input.author, input.body);
    if (!result.ok) throw new InvalidCommentError(result.reason);

    const now = this.clock.now();
    const lastAt = await this.store.lastCommentAt(input.clientKey);
    if (!canCommentAgain(lastAt, now)) throw new CommentRateLimitedError();

    return this.store.addComment(result.draft, now, input.clientKey);
  }
}

export class DeleteComment {
  constructor(private readonly store: CommentStore) {}

  async execute(id: number): Promise<void> {
    if (!(await this.store.deleteComment(id)))
      throw new CommentNotFoundError(id);
  }
}
