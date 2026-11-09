import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InvalidLiveUpdateError } from '../application/errors';
import {
  LiveUpdateInput,
  RecordLiveUpdate,
} from '../application/record-live-update';
import { LiveTokenGuard } from './live-token.guard';

/** Translates the bridge's JSON into the use case input; rejects malformed bodies. */
export function parseLiveUpdateBody(body: unknown): LiveUpdateInput {
  if (typeof body !== 'object' || body === null)
    throw new BadRequestException('JSON body required');
  const { online, level, observedAt } = body as Record<string, unknown>;

  if (typeof online !== 'boolean')
    throw new BadRequestException('"online" must be a boolean');
  if (level !== undefined && level !== null && typeof level !== 'number') {
    throw new BadRequestException('"level" must be a number or null');
  }
  let observed: Date | undefined;
  if (observedAt !== undefined) {
    observed = new Date(
      typeof observedAt === 'string' || typeof observedAt === 'number'
        ? observedAt
        : NaN,
    );
    if (Number.isNaN(observed.getTime()))
      throw new BadRequestException('"observedAt" must be a date');
  }
  return {
    online,
    level: typeof level === 'number' ? level : null,
    observedAt: observed,
  };
}

@Controller('live')
@UseGuards(LiveTokenGuard)
export class LiveController {
  constructor(private readonly recordLiveUpdate: RecordLiveUpdate) {}

  @Post()
  @HttpCode(204)
  async record(@Body() body: unknown): Promise<void> {
    try {
      await this.recordLiveUpdate.execute(parseLiveUpdateBody(body));
    } catch (error) {
      if (error instanceof InvalidLiveUpdateError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }
}
