import { Controller, Get } from '@nestjs/common';

/** Liveness probe for Render (no Blizzard or database calls). */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { ok: true };
  }
}
