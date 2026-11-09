import { BadRequestException } from '@nestjs/common';
import { parseLiveUpdateBody } from './live.controller';

describe('parseLiveUpdateBody', () => {
  it('parses a full body', () => {
    expect(
      parseLiveUpdateBody({
        online: true,
        level: 11,
        observedAt: '2026-11-09T02:00:00Z',
      }),
    ).toEqual({
      online: true,
      level: 11,
      observedAt: new Date('2026-11-09T02:00:00Z'),
    });
  });

  it('defaults level to null and observedAt to undefined', () => {
    expect(parseLiveUpdateBody({ online: false })).toEqual({
      online: false,
      level: null,
      observedAt: undefined,
    });
  });

  it.each([
    null,
    'x',
    {},
    { online: 'yes' },
    { online: true, level: '11' },
    { online: true, observedAt: 'nope' },
  ])('rejects %p', (body) => {
    expect(() => parseLiveUpdateBody(body)).toThrow(BadRequestException);
  });
});
