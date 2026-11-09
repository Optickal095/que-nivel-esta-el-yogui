import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { APP_CONFIG } from '../config/app-config';
import type { AppConfig } from '../config/app-config';
import { assertBearerToken } from './bearer-token';

/** Only the bridge (which knows LIVE_TOKEN) may post live updates. Disabled when LIVE_TOKEN is unset. */
@Injectable()
export class LiveTokenGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    assertBearerToken(
      context.switchToHttp().getRequest<Request>().headers.authorization,
      this.config.liveToken,
      'Live updates are disabled (LIVE_TOKEN not set)',
    );
    return true;
  }
}
