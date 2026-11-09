import { Prisma } from '@prisma/client';
import {
  LevelHistoryStore,
  ProfileSnapshotStore,
  StoredProfile,
} from '../../application/ports';
import { CharacterProfile } from '../../domain/character-profile';
import { LevelEvent } from '../../domain/level-history';
import { PrismaService } from './prisma.service';

const SINGLETON_ID = 1;

type SerializedProfile = Omit<CharacterProfile, 'lastLoginAt'> & {
  lastLoginAt: string;
};

/**
 * Repository: implements the two storage ports on Postgres via Prisma.
 * One class because they share the connection, but each use case only sees
 * the port it needs.
 */
export class PrismaCharacterStore
  implements ProfileSnapshotStore, LevelHistoryStore
{
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(): Promise<StoredProfile | null> {
    const row = await this.prisma.profileSnapshot.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (!row) return null;
    const data = row.data as unknown as Partial<SerializedProfile> &
      Pick<SerializedProfile, 'lastLoginAt'>;
    return {
      profile: {
        ...(data as SerializedProfile),
        // snapshots saved before these fields existed
        funStats: data.funStats ?? [],
        deaths: data.deaths ?? null,
        lastLoginAt: new Date(data.lastLoginAt),
      },
      fetchedAt: row.fetchedAt,
    };
  }

  async saveSnapshot(snapshot: StoredProfile): Promise<void> {
    const data = {
      ...snapshot.profile,
      lastLoginAt: snapshot.profile.lastLoginAt.toISOString(),
    } as unknown as Prisma.InputJsonValue;
    await this.prisma.profileSnapshot.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, data, fetchedAt: snapshot.fetchedAt },
      update: { data, fetchedAt: snapshot.fetchedAt },
    });
  }

  async getLastLevelEvent(): Promise<LevelEvent | null> {
    const row = await this.prisma.levelEvent.findFirst({
      orderBy: [{ level: 'desc' }, { at: 'desc' }],
    });
    return row ? toLevelEvent(row) : null;
  }

  async getLevelEvents(): Promise<LevelEvent[]> {
    const rows = await this.prisma.levelEvent.findMany({
      orderBy: { at: 'asc' },
    });
    return rows.map(toLevelEvent);
  }

  async addLevelEvent(event: LevelEvent): Promise<void> {
    await this.prisma.levelEvent.create({
      data: {
        level: event.level,
        at: event.at,
        deathsAtStart: event.deathsAtStart ?? null,
      },
    });
  }

  async setDeathsAtStart(level: number, deaths: number): Promise<void> {
    await this.prisma.levelEvent.updateMany({
      where: { level, deathsAtStart: null },
      data: { deathsAtStart: deaths },
    });
  }
}

function toLevelEvent(row: {
  level: number;
  at: Date;
  deathsAtStart: number | null;
}): LevelEvent {
  return {
    level: row.level,
    at: row.at,
    deathsAtStart: row.deathsAtStart,
  };
}
