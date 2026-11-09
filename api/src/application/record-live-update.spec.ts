import { FakeClock, InMemoryStore } from '../../test/doubles';
import { InvalidLiveUpdateError } from './errors';
import { GetLevelHistory } from './get-level-history';
import { RecordLiveUpdate } from './record-live-update';

function setup() {
  const store = new InMemoryStore();
  const clock = new FakeClock(new Date('2026-11-09T02:00:00Z'));
  return { store, clock, useCase: new RecordLiveUpdate(store, store, clock) };
}

describe('RecordLiveUpdate', () => {
  it('saves presence and records a new level', async () => {
    const { useCase, store, clock } = setup();

    await useCase.execute({ online: true, level: 11 });

    expect(store.live).toEqual({
      online: true,
      level: 11,
      observedAt: clock.now(),
    });
    expect(store.events).toEqual([
      { level: 11, at: clock.now(), source: 'live' },
    ]);
  });

  it('does not record a level that is not higher', async () => {
    const { useCase, store, clock } = setup();
    store.events.push({ level: 11, at: clock.now(), source: 'api' });

    await useCase.execute({ online: true, level: 11 });

    expect(store.events).toHaveLength(1);
  });

  it('accepts an offline signal without level', async () => {
    const { useCase, store } = setup();
    await useCase.execute({ online: false, level: null });
    expect(store.live?.online).toBe(false);
    expect(store.events).toHaveLength(0);
  });

  it('clamps a future observedAt to now', async () => {
    const { useCase, store, clock } = setup();
    await useCase.execute({
      online: true,
      level: null,
      observedAt: new Date('2030-01-01T00:00:00Z'),
    });
    expect(store.live?.observedAt).toEqual(clock.now());
  });

  it('rejects invalid levels', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ online: true, level: 0 }),
    ).rejects.toBeInstanceOf(InvalidLiveUpdateError);
    await expect(
      useCase.execute({ online: true, level: 999 }),
    ).rejects.toBeInstanceOf(InvalidLiveUpdateError);
  });
});

describe('GetLevelHistory', () => {
  it('returns events oldest first', async () => {
    const { store } = setup();
    store.events.push({
      level: 11,
      at: new Date('2026-11-09T00:00:00Z'),
      source: 'live',
    });
    store.events.push({
      level: 10,
      at: new Date('2026-11-08T00:00:00Z'),
      source: 'api',
    });

    const events = await new GetLevelHistory(store).execute();

    expect(events.map((e) => e.level)).toEqual([10, 11]);
  });
});
