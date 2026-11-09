import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { CHARACTER_PROFILE_PROVIDER, CLOCK } from '../src/application/ports';
import { PrismaCharacterStore } from '../src/infrastructure/persistence/prisma-character.store';
import { PrismaService } from '../src/infrastructure/persistence/prisma.service';
import { FakeClock, FakeProvider, InMemoryStore, aProfile } from './doubles';

describe('Character API (e2e)', () => {
  let app: INestApplication<App>;
  let store: InMemoryStore;
  let provider: FakeProvider;

  beforeEach(async () => {
    Object.assign(process.env, {
      BLIZZARD_CLIENT_ID: 'test',
      BLIZZARD_CLIENT_SECRET: 'test',
      CHARACTER_NAME: 'Dr',
      CHARACTER_SURNAME: 'Yogui',
      LIVE_TOKEN: 'secret-token',
    });
    store = new InMemoryStore();
    provider = new FakeProvider(aProfile({ level: 10 }));

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(PrismaCharacterStore)
      .useValue(store)
      .overrideProvider(CHARACTER_PROFILE_PROVIDER)
      .useValue(provider)
      .overrideProvider(CLOCK)
      .useValue(new FakeClock(new Date('2026-11-09T02:00:00Z')))
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(() => app.close());

  it('GET /api/character returns the overview', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/character')
      .expect(200);
    expect(res.body).toMatchObject({
      name: 'Dr',
      surname: 'Yogui',
      level: 10,
      lastLoginAt: '2026-11-09T00:07:19.000Z',
      levelSince: { at: '2026-11-09T02:00:00.000Z', exact: false },
      funStats: [],
      presence: { status: 'unknown', source: 'api' },
    });
  });

  it('GET /api/character returns 503 when the character is not available', async () => {
    provider.result = null;
    await request(app.getHttpServer()).get('/api/character').expect(503);
  });

  it('POST /api/live requires the token', async () => {
    await request(app.getHttpServer())
      .post('/api/live')
      .send({ online: true, level: 11 })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/live')
      .set('Authorization', 'Bearer wrong')
      .send({ online: true, level: 11 })
      .expect(401);
  });

  it('POST /api/live updates presence, level and history', async () => {
    await request(app.getHttpServer())
      .post('/api/live')
      .set('Authorization', 'Bearer secret-token')
      .send({ online: true, level: 11 })
      .expect(204);

    const overview = await request(app.getHttpServer())
      .get('/api/character')
      .expect(200);
    expect(overview.body).toMatchObject({
      level: 11,
      apiLevel: 10,
      presence: { status: 'online', source: 'live' },
    });

    const history = await request(app.getHttpServer())
      .get('/api/character/history')
      .expect(200);
    expect(history.body).toEqual([
      { level: 11, at: '2026-11-09T02:00:00.000Z', source: 'live' },
    ]);
  });

  it('POST /api/live rejects a malformed body', async () => {
    await request(app.getHttpServer())
      .post('/api/live')
      .set('Authorization', 'Bearer secret-token')
      .send({ online: 'yes' })
      .expect(400);
  });
});
