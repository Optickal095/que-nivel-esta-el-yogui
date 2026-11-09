import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { APP_CONFIG } from '../config/app-config';
import type { AppConfig } from '../config/app-config';

/**
 * Moderation endpoints: only whoever knows ADMIN_TOKEN (Eduardo), sent as
 * `Authorization: Bearer <token>` and compared in constant time. Disabled when unset.
 */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.adminToken;
    if (!expected)
      throw new UnauthorizedException(
        'Moderation is disabled (ADMIN_TOKEN not set)',
      );

    const header =
      context.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const given = header.startsWith('Bearer ') ? header.slice(7) : '';
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new UnauthorizedException();
    return true;
  }
}
