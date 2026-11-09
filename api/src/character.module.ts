import { Logger, Module } from '@nestjs/common';
import { GetCharacterOverview } from './application/get-character-overview';
import { GetLevelHistory } from './application/get-level-history';
import {
  CHARACTER_PROFILE_PROVIDER,
  CLOCK,
  CharacterProfileProvider,
  Clock,
  LEVEL_HISTORY_STORE,
  LevelHistoryStore,
  PROFILE_SNAPSHOT_STORE,
  ProfileSnapshotStore,
} from './application/ports';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { BlizzardApiClient } from './infrastructure/blizzard/blizzard-api.client';
import { BlizzardCharacterProvider } from './infrastructure/blizzard/blizzard-character.provider';
import { PrismaCharacterStore } from './infrastructure/persistence/prisma-character.store';
import { PrismaService } from './infrastructure/persistence/prisma.service';
import { CharacterController } from './presentation/character.controller';
import { SharedModule } from './shared.module';

/**
 * Composition root for the character feature: binds each port to its adapter
 * and builds the (framework-free) use cases with factories.
 */
@Module({
  imports: [SharedModule],
  controllers: [CharacterController],
  providers: [
    {
      provide: PrismaCharacterStore,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCharacterStore(prisma),
    },
    { provide: PROFILE_SNAPSHOT_STORE, useExisting: PrismaCharacterStore },
    { provide: LEVEL_HISTORY_STORE, useExisting: PrismaCharacterStore },
    {
      provide: CHARACTER_PROFILE_PROVIDER,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) =>
        new BlizzardCharacterProvider(
          new BlizzardApiClient(config.blizzard),
          config.character.name,
          config.character.surname,
          new Logger('Blizzard'),
        ),
    },
    {
      provide: GetCharacterOverview,
      inject: [
        CHARACTER_PROFILE_PROVIDER,
        PROFILE_SNAPSHOT_STORE,
        LEVEL_HISTORY_STORE,
        CLOCK,
      ],
      useFactory: (
        provider: CharacterProfileProvider,
        snapshots: ProfileSnapshotStore,
        history: LevelHistoryStore,
        clock: Clock,
      ) =>
        new GetCharacterOverview(
          provider,
          snapshots,
          history,
          clock,
          new Logger('GetCharacterOverview'),
        ),
    },
    {
      provide: GetLevelHistory,
      inject: [LEVEL_HISTORY_STORE],
      useFactory: (history: LevelHistoryStore) => new GetLevelHistory(history),
    },
  ],
})
export class CharacterModule {}
