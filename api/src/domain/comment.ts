/**
 * Domain: visitors' comments. No accounts: a free name (or "Anónimo") and a
 * message. Rules here are pure; storage and rate limiting by client are ports.
 */

export interface Comment {
  id: number;
  author: string;
  body: string;
  createdAt: Date;
}

export interface CommentDraft {
  author: string;
  body: string;
}

export const ANONYMOUS_AUTHOR = 'Anónimo';
export const AUTHOR_MAX_LENGTH = 40;
export const BODY_MAX_LENGTH = 500;
/** Minimum time between two comments from the same client (anti-spam). */
export const COMMENT_COOLDOWN_MS = 30_000;

export type CommentValidation =
  { ok: true; draft: CommentDraft } | { ok: false; reason: string };

// Control characters except tab and newline.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

function clean(value: string): string {
  return value.replace(CONTROL_CHARS, '').trim();
}

/** Normalizes and validates what a visitor typed. */
export function validateComment(
  author: string,
  body: string,
): CommentValidation {
  const name = clean(author).replace(/\s+/g, ' ');
  const text = clean(body).replace(/\n{3,}/g, '\n\n');

  if (text.length === 0) return { ok: false, reason: 'El mensaje está vacío.' };
  if (text.length > BODY_MAX_LENGTH)
    return {
      ok: false,
      reason: `El mensaje supera los ${BODY_MAX_LENGTH} caracteres.`,
    };
  if (name.length > AUTHOR_MAX_LENGTH)
    return {
      ok: false,
      reason: `El nombre supera los ${AUTHOR_MAX_LENGTH} caracteres.`,
    };
  return { ok: true, draft: { author: name || ANONYMOUS_AUTHOR, body: text } };
}

/** Whether a client that last commented at `lastAt` may comment again. */
export function canCommentAgain(lastAt: Date | null, now: Date): boolean {
  return (
    lastAt === null || now.getTime() - lastAt.getTime() >= COMMENT_COOLDOWN_MS
  );
}
