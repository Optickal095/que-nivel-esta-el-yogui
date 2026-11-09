import { UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

/**
 * Shared check for the token guards: `Authorization: Bearer <expected>`,
 * compared in constant time. A missing `expected` disables the endpoint.
 */
export function assertBearerToken(
  authorization: string | undefined,
  expected: string | null,
  disabledMessage: string,
): void {
  if (!expected) throw new UnauthorizedException(disabledMessage);
  const header = authorization ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    throw new UnauthorizedException();
}
