import { LIVE_SIGNAL_TTL_MS, resolvePresence } from './presence';

const now = new Date('2026-11-09T02:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe('resolvePresence', () => {
  it('is unknown with the API last login when there is no live data', () => {
    const lastLogin = minutesAgo(120);
    expect(resolvePresence(lastLogin, null, now)).toEqual({
      status: 'unknown',
      lastSeenAt: lastLogin,
      source: 'api',
    });
  });

  it('is online with a fresh live signal', () => {
    const live = { online: true, level: 11, observedAt: minutesAgo(1) };
    expect(resolvePresence(minutesAgo(60), live, now)).toEqual({
      status: 'online',
      lastSeenAt: live.observedAt,
      source: 'live',
    });
  });

  it('is offline with a fresh live signal saying offline', () => {
    const live = { online: false, level: 11, observedAt: minutesAgo(2) };
    expect(resolvePresence(minutesAgo(60), live, now).status).toBe('offline');
  });

  it('expires a live "online" after the TTL, keeping it as last seen', () => {
    const live = {
      online: true,
      level: 11,
      observedAt: new Date(now.getTime() - LIVE_SIGNAL_TTL_MS - 1),
    };
    expect(resolvePresence(minutesAgo(600), live, now)).toEqual({
      status: 'unknown',
      lastSeenAt: live.observedAt,
      source: 'live',
    });
  });

  it('prefers the API login when it is newer than a stale live signal', () => {
    const live = { online: true, level: 11, observedAt: minutesAgo(300) };
    const lastLogin = minutesAgo(30);
    expect(resolvePresence(lastLogin, live, now)).toEqual({
      status: 'unknown',
      lastSeenAt: lastLogin,
      source: 'api',
    });
  });
});
