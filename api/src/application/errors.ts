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
