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

/** Moderation endpoints: only whoever knows ADMIN_TOKEN (Eduardo). Disabled when unset. */
@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    assertBearerToken(
      context.switchToHttp().getRequest<Request>().headers.authorization,
      this.config.adminToken,
      'Moderation is disabled (ADMIN_TOKEN not set)',
    );
    return true;
  }
}
