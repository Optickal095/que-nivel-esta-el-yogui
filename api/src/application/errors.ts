/** No data at all: the provider has never returned the character and nothing is stored. */
export class CharacterUnavailableError extends Error {
  constructor(reason: string) {
    super(`Character unavailable: ${reason}`);
    this.name = 'CharacterUnavailableError';
  }
}

/** Input from the live bridge that breaks the rules (e.g. invalid level). */
export class InvalidLiveUpdateError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidLiveUpdateError';
  }
}

/** A comment that breaks the rules (empty, too long...). The message is shown to the visitor. */
export class InvalidCommentError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidCommentError';
  }
}

/** The same client commented less than COMMENT_COOLDOWN_MS ago. */
export class CommentRateLimitedError extends Error {
  constructor() {
    super('Espera unos segundos antes de comentar de nuevo.');
    this.name = 'CommentRateLimitedError';
  }
}

export class CommentNotFoundError extends Error {
  constructor(id: number) {
    super(`Comment ${id} not found`);
    this.name = 'CommentNotFoundError';
  }
}
