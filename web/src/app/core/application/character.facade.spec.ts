import { TestBed } from '@angular/core/testing';
import { FakeCharacterGateway, anOverview } from '../../testing/fake-character.gateway';
import { CHARACTER_GATEWAY } from './character.gateway';
import { CharacterFacade } from './character.facade';

describe('CharacterFacade', () => {
  let gateway: FakeCharacterGateway;
  let facade: CharacterFacade;

  beforeEach(() => {
    gateway = new FakeCharacterGateway();
    TestBed.configureTestingModule({
      providers: [CharacterFacade, { provide: CHARACTER_GATEWAY, useValue: gateway }],
    });
    facade = TestBed.inject(CharacterFacade);
  });

  it('starts loading, then exposes overview and history', () => {
    expect(facade.loading()).toBeTrue();
    facade.refresh();
    expect(facade.loading()).toBeFalse();
    expect(facade.overview()?.level).toBe(10);
    expect(facade.history().length).toBe(1);
  });

  it('shows an error only when there is nothing to show', () => {
    gateway.overview = new Error('down');
    facade.refresh();
    expect(facade.error()).toContain('No pudimos');
  });

  it('keeps the last data when a later refresh fails', () => {
    facade.refresh();
    gateway.overview = new Error('down');
    facade.refresh();
    expect(facade.overview()?.level).toBe(10);
    expect(facade.error()).toBeNull();
  });

  it('updates to the new level on refresh', () => {
    facade.refresh();
    gateway.overview = anOverview({ level: 11 });
    facade.refresh();
    expect(facade.overview()?.level).toBe(11);
  });
});
