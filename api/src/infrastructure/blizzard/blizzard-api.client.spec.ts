import { BlizzardApiClient, BlizzardApiError } from './blizzard-api.client';

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function setup(responses: Response[]) {
  const calls: string[] = [];
  const fetchFn = jest.fn((input: string | URL | Request) => {
    calls.push(input instanceof Request ? input.url : input.toString());
    const next = responses.shift();
    if (!next) throw new Error('unexpected request');
    return Promise.resolve(next);
  });
  let now = 0;
  const client = new BlizzardApiClient(
    { clientId: 'id', clientSecret: 'secret', region: 'us' },
    fetchFn,
    () => now,
  );
  return { client, calls, setNow: (ms: number) => (now = ms) };
}

const token = () => json(200, { access_token: 'tok', expires_in: 3600 });

describe('BlizzardApiClient', () => {
  it('gets a token, then calls the Forever namespace with Spanish locale', async () => {
    const { client, calls } = setup([token(), json(200, { level: 10 })]);

    await expect(
      client.get('/profile/wow/character/dr-yogui', 'profile'),
    ).resolves.toEqual({ level: 10 });

    expect(calls[0]).toBe('https://oauth.battle.net/token');
    expect(calls[1]).toBe(
      'https://us.api.blizzard.com/profile/wow/character/dr-yogui?namespace=profile-forever-us&locale=es_MX',
    );
  });

  it('reuses the token until it is about to expire', async () => {
    const { client, calls, setNow } = setup([
      token(),
      json(200),
      json(200),
      token(),
      json(200),
    ]);

    await client.get('/a', 'profile');
    setNow(10 * 60_000);
    await client.get('/b', 'profile');
    setNow(3600_000);
    await client.get('/c', 'profile');

    expect(calls.filter((c) => c.includes('oauth')).length).toBe(2);
  });

  it('returns null on 404', async () => {
    const { client } = setup([token(), json(404)]);
    await expect(client.get('/x', 'profile')).resolves.toBeNull();
  });

  it('renews the token once on 401', async () => {
    const { client, calls } = setup([
      token(),
      json(401),
      token(),
      json(200, { ok: true }),
    ]);
    await expect(client.get('/x', 'static')).resolves.toEqual({ ok: true });
    expect(calls.filter((c) => c.includes('oauth')).length).toBe(2);
  });

  it('throws BlizzardApiError on other failures', async () => {
    const { client } = setup([token(), json(503)]);
    await expect(client.get('/x', 'profile')).rejects.toBeInstanceOf(
      BlizzardApiError,
    );
  });
});
