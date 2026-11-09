import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { HttpCharacterGateway } from './http-character.gateway';

describe('HttpCharacterGateway', () => {
  let gateway: HttpCharacterGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpCharacterGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.com' },
      ],
    });
    gateway = TestBed.inject(HttpCharacterGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('calls the configured API and parses dates', async () => {
    const result = firstValueFrom(gateway.getOverview());
    http.expectOne('https://api.example.com/api/character').flush({
      name: 'Dr',
      level: 10,
      lastLoginAt: '2026-11-09T00:07:19.000Z',
      profileFetchedAt: '2026-11-09T02:00:00.000Z',
      levelSince: { at: '2026-11-09T02:00:00.000Z', exact: false },
    });

    const overview = await result;
    expect(overview.lastLoginAt).toEqual(new Date('2026-11-09T00:07:19.000Z'));
    expect(overview.levelSince?.at).toEqual(new Date('2026-11-09T02:00:00.000Z'));
    expect(overview.funStats).toEqual([]);
  });

  it('parses the level history', async () => {
    const result = firstValueFrom(gateway.getLevelHistory());
    http
      .expectOne('https://api.example.com/api/character/history')
      .flush([{ level: 10, at: '2026-11-09T02:00:00.000Z' }]);
    expect((await result)[0].at).toEqual(new Date('2026-11-09T02:00:00.000Z'));
  });
});
