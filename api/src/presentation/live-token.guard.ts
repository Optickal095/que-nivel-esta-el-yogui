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

/** Only the bridge (which knows LIVE_TOKEN) may post live updates. Disabled when LIVE_TOKEN is unset. */
@Injectable()
export class LiveTokenGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.liveToken;
    if (!expected)
      throw new UnauthorizedException(
        'Live updates are disabled (LIVE_TOKEN not set)',
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
