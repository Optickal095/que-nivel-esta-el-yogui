import { FakeClock, InMemoryCommentStore } from '../../test/doubles';
import { COMMENT_COOLDOWN_MS } from '../domain/comment';
import { DeleteComment, ListComments, PostComment } from './comments';
import {
  CommentNotFoundError,
  CommentRateLimitedError,
  InvalidCommentError,
} from './errors';

describe('comments use cases', () => {
  let store: InMemoryCommentStore;
  let clock: FakeClock;
  let post: PostComment;

  beforeEach(() => {
    store = new InMemoryCommentStore();
    clock = new FakeClock(new Date('2026-11-09T05:00:00Z'));
    post = new PostComment(store, clock);
  });

  it('posts a normalized comment and lists newest first', async () => {
    await post.execute({ author: '', body: 'primero', clientKey: 'a' });
    clock.advance(1000);
    await post.execute({ author: 'Edu', body: ' segundo ', clientKey: 'b' });

    const list = await new ListComments(store).execute();
    expect(list.map((c) => [c.author, c.body])).toEqual([
      ['Edu', 'segundo'],
      ['Anónimo', 'primero'],
    ]);
    expect(list[0]).not.toHaveProperty('clientKey');
  });

  it('rejects invalid comments', async () => {
    await expect(
      post.execute({ author: 'x', body: ' ', clientKey: 'a' }),
    ).rejects.toBeInstanceOf(InvalidCommentError);
  });

  it('applies the cooldown per client', async () => {
    await post.execute({ author: '', body: 'uno', clientKey: 'a' });
    await expect(
      post.execute({ author: '', body: 'dos', clientKey: 'a' }),
    ).rejects.toBeInstanceOf(CommentRateLimitedError);
    await post.execute({ author: '', body: 'otro', clientKey: 'b' });

    clock.advance(COMMENT_COOLDOWN_MS);
    await post.execute({ author: '', body: 'dos', clientKey: 'a' });
    expect(store.rows).toHaveLength(3);
  });

  it('deletes a comment, and fails for an unknown id', async () => {
    const c = await post.execute({ author: '', body: 'chao', clientKey: 'a' });
    const del = new DeleteComment(store);
    await del.execute(c.id);
    expect(store.rows).toHaveLength(0);
    await expect(del.execute(c.id)).rejects.toBeInstanceOf(
      CommentNotFoundError,
    );
  });
});
