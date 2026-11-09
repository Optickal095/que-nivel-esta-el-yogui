import { ConfigService } from '@nestjs/config';

export interface AppConfig {
  blizzard: { clientId: string; clientSecret: string; region: string };
  character: { name: string; surname: string };
  adminToken: string | null;
}

/** Reads and validates the environment once, so a missing variable fails at startup, not mid-request. */
export function loadAppConfig(config: ConfigService): AppConfig {
  const required = (key: string): string => {
    const value = config.get<string>(key)?.trim();
    if (!value)
      throw new Error(
        `Missing environment variable ${key} (see api/.env.example)`,
      );
    return value;
  };

  return {
    blizzard: {
      clientId: required('BLIZZARD_CLIENT_ID'),
      clientSecret: required('BLIZZARD_CLIENT_SECRET'),
      region: config.get<string>('BLIZZARD_REGION')?.trim() || 'us',
    },
    character: {
      name: required('CHARACTER_NAME'),
      surname: required('CHARACTER_SURNAME'),
    },
    adminToken: config.get<string>('ADMIN_TOKEN')?.trim() || null,
  };
}

export const APP_CONFIG = Symbol('AppConfig');
