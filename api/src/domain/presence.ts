/**
 * Domain: is the character online right now, and when was it last seen?
 *
 * Two sources:
 *  - Blizzard API: last_login_timestamp. Always available, but only says when
 *    the last session started; it cannot tell "online now".
 *  - Live signal (phase 2): the bridge reports what Eduardo's addon sees in the
 *    friends list. Only valid while it keeps arriving; it expires after a TTL so
 *    the site never shows "online" forever when the bridge stops.
 */

export type PresenceStatus = 'online' | 'offline' | 'unknown';

export interface LiveSignal {
  online: boolean;
  level: number | null;
  observedAt: Date;
}

export interface Presence {
  status: PresenceStatus;
  lastSeenAt: Date | null;
  source: 'api' | 'live';
}

export const LIVE_SIGNAL_TTL_MS = 10 * 60 * 1000;

function latest(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

export function resolvePresence(
  apiLastLoginAt: Date | null,
  live: LiveSignal | null,
  now: Date,
  ttlMs: number = LIVE_SIGNAL_TTL_MS,
): Presence {
  const liveIsFresh =
    live !== null && now.getTime() - live.observedAt.getTime() <= ttlMs;

  if (live && liveIsFresh) {
    return live.online
      ? { status: 'online', lastSeenAt: live.observedAt, source: 'live' }
      : {
          status: 'offline',
          lastSeenAt: latest(live.observedAt, apiLastLoginAt),
          source: 'live',
        };
  }

  // No fresh live data: we only know the last time we saw them.
  const lastSeenAt = latest(live?.observedAt ?? null, apiLastLoginAt);
  const source = live && lastSeenAt === live.observedAt ? 'live' : 'api';
  return { status: 'unknown', lastSeenAt, source };
}
