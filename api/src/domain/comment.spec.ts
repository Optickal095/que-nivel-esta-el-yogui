import {
  ANONYMOUS_AUTHOR,
  BODY_MAX_LENGTH,
  COMMENT_COOLDOWN_MS,
  canCommentAgain,
  validateComment,
} from './comment';

describe('validateComment', () => {
  it('trims and keeps a valid comment', () => {
    expect(validateComment('  Edu  ', '  ¡Vamos Yogui!  ')).toEqual({
      ok: true,
      draft: { author: 'Edu', body: '¡Vamos Yogui!' },
    });
  });

  it('uses "Anónimo" when there is no name', () => {
    const r = validateComment('   ', 'hola');
    expect(r.ok && r.draft.author).toBe(ANONYMOUS_AUTHOR);
  });

  it('rejects empty and too long messages or names', () => {
    expect(validateComment('a', '   ').ok).toBe(false);
    expect(validateComment('a', 'x'.repeat(BODY_MAX_LENGTH + 1)).ok).toBe(
      false,
    );
    expect(validateComment('x'.repeat(41), 'hola').ok).toBe(false);
  });

  it('strips control characters and collapses blank lines', () => {
    const r = validateComment('Ed\u0007u', 'a\n\n\n\nb');
    expect(r).toEqual({ ok: true, draft: { author: 'Edu', body: 'a\n\nb' } });
  });
});

describe('canCommentAgain', () => {
  const now = new Date('2026-11-09T05:00:00Z');

  it('allows the first comment and one after the cooldown', () => {
    expect(canCommentAgain(null, now)).toBe(true);
    expect(
      canCommentAgain(new Date(now.getTime() - COMMENT_COOLDOWN_MS), now),
    ).toBe(true);
  });

  it('blocks a comment inside the cooldown', () => {
    expect(canCommentAgain(new Date(now.getTime() - 1000), now)).toBe(false);
  });
});
