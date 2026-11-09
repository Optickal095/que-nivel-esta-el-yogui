import { BlizzardTokenResponse } from './blizzard-types';

export interface BlizzardApiConfig {
  clientId: string;
  clientSecret: string;
  region: string; // 'us', 'eu', ...
  locale?: string;
}

export type BlizzardNamespace = 'profile' | 'static';

export class BlizzardApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BlizzardApiError';
  }
}

const TOKEN_URL = 'https://oauth.battle.net/token';
const TOKEN_SAFETY_MARGIN_MS = 60_000;

/**
 * Low-level HTTP client for Blizzard's API: client-credentials OAuth (token
 * cached until shortly before it expires, renewed once on a 401) and GETs on
 * the WoW Forever namespaces. 404 → null; other failures → BlizzardApiError.
 */
export class BlizzardApiClient {
  private token: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly config: BlizzardApiConfig,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly nowMs: () => number = Date.now,
  ) {}

  async get<T>(path: string, namespace: BlizzardNamespace): Promise<T | null> {
    let res = await this.request(path, namespace);
    if (res.status === 401) {
      this.token = null; // token revoked or expired early: renew once
      res = await this.request(path, namespace);
    }
    if (res.status === 404) return null;
    if (!res.ok)
      throw new BlizzardApiError(
        res.status,
        `GET ${path} → HTTP ${res.status}`,
      );
    return (await res.json()) as T;
  }

  private async request(
    path: string,
    namespace: BlizzardNamespace,
  ): Promise<Response> {
    const { region, locale = 'es_MX' } = this.config;
    const url = new URL(`https://${region}.api.blizzard.com${path}`);
    url.searchParams.set('namespace', `${namespace}-forever-${region}`);
    url.searchParams.set('locale', locale);
    return this.fetchFn(url, {
      headers: { Authorization: `Bearer ${await this.accessToken()}` },
    });
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.nowMs() < this.token.expiresAt)
      return this.token.value;

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');
    const res = await this.fetchFn(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok)
      throw new BlizzardApiError(
        res.status,
        `OAuth token → HTTP ${res.status}`,
      );

    const body = (await res.json()) as BlizzardTokenResponse;
    this.token = {
      value: body.access_token,
      expiresAt: this.nowMs() + body.expires_in * 1000 - TOKEN_SAFETY_MARGIN_MS,
    };
    return this.token.value;
  }
}
