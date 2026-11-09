import {
  FakeClock,
  FakeProvider,
  InMemoryStore,
  SilentLogger,
  aProfile,
} from '../../test/doubles';
import { CharacterUnavailableError } from './errors';
import {
  GetCharacterOverview,
  PROFILE_MAX_AGE_MS,
} from './get-character-overview';

function setup(provider: FakeProvider) {
  const store = new InMemoryStore();
  const clock = new FakeClock(new Date('2026-11-09T02:00:00Z'));
  const logger = new SilentLogger();
  const useCase = new GetCharacterOverview(
    provider,
    store,
    store,
    store,
    clock,
    logger,
  );
  return { store, clock, logger, useCase };
}

describe('GetCharacterOverview', () => {
  it('fetches, stores the snapshot and records the first level', async () => {
    const { useCase, store, clock } = setup(
      new FakeProvider(aProfile({ level: 10 })),
    );

    const overview = await useCase.execute();

    expect(overview.level).toBe(10);
    expect(store.snapshot?.fetchedAt).toEqual(clock.now());
    expect(store.events).toEqual([
      { level: 10, at: clock.now(), source: 'api', deathsAtStart: 24 },
    ]);
  });

  it('serves the cached snapshot while it is fresh', async () => {
    const provider = new FakeProvider(aProfile());
    const { useCase, clock } = setup(provider);

    await useCase.execute();
    clock.advance(PROFILE_MAX_AGE_MS - 1);
    await useCase.execute();

    expect(provider.calls).toBe(1);
  });

  it('refreshes a stale snapshot and records the level-up', async () => {
    const provider = new FakeProvider(aProfile({ level: 10 }));
    const { useCase, clock, store } = setup(provider);

    await useCase.execute();
    provider.result = aProfile({ level: 11 });
    clock.advance(PROFILE_MAX_AGE_MS + 1);
    const overview = await useCase.execute();

    expect(provider.calls).toBe(2);
    expect(overview.level).toBe(11);
    expect(store.events.map((e) => e.level)).toEqual([10, 11]);
  });

  it('counts the deaths at the current level from its baseline', async () => {
    const provider = new FakeProvider(aProfile({ level: 11, deaths: 24 }));
    const { useCase, clock } = setup(provider);

    await useCase.execute();
    provider.result = aProfile({ level: 11, deaths: 27 });
    clock.advance(PROFILE_MAX_AGE_MS + 1);
    const overview = await useCase.execute();

    expect(overview.deathsAtLevel).toEqual({ count: 3, exact: false });
  });

  it('fills a missing deaths baseline (level seen live first)', async () => {
    const provider = new FakeProvider(aProfile({ level: 12, deaths: 30 }));
    const { useCase, store, clock } = setup(provider);
    store.events.push({ level: 12, at: clock.now(), source: 'live' });

    await useCase.execute();

    expect(store.events).toHaveLength(1);
    expect(store.events[0].deathsAtStart).toBe(30);
  });

  it('keeps the last good snapshot when the provider fails', async () => {
    const provider = new FakeProvider(aProfile({ level: 10 }));
    const { useCase, clock, logger } = setup(provider);

    await useCase.execute();
    provider.result = new Error('Blizzard down');
    clock.advance(PROFILE_MAX_AGE_MS + 1);
    const overview = await useCase.execute();

    expect(overview.level).toBe(10);
    expect(logger.messages[0]).toContain('Blizzard down');
  });

  it('fails when there is no snapshot and the character is not found', async () => {
    const { useCase } = setup(new FakeProvider(null));
    await expect(useCase.execute()).rejects.toBeInstanceOf(
      CharacterUnavailableError,
    );
  });

  it('shares one refresh between concurrent requests', async () => {
    const provider = new FakeProvider(aProfile(), 20);
    const { useCase } = setup(provider);

    await Promise.all([
      useCase.execute(),
      useCase.execute(),
      useCase.execute(),
    ]);

    expect(provider.calls).toBe(1);
  });

  it('shows the live level when it is ahead of the API', async () => {
    const { useCase, store, clock } = setup(
      new FakeProvider(aProfile({ level: 10 })),
    );
    store.events.push({ level: 12, at: clock.now(), source: 'live' });
    store.live = { online: true, level: 12, observedAt: clock.now() };

    const overview = await useCase.execute();

    expect(overview.level).toBe(12);
    expect(overview.presence.status).toBe('online');
  });
});
