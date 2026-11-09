import { Logger, Module } from '@nestjs/common';
import { GetCharacterOverview } from './application/get-character-overview';
import { GetLevelHistory } from './application/get-level-history';
import {
  CHARACTER_PROFILE_PROVIDER,
  CLOCK,
  CharacterProfileProvider,
  Clock,
  LEVEL_HISTORY_STORE,
  LIVE_SIGNAL_STORE,
  LevelHistoryStore,
  LiveSignalStore,
  PROFILE_SNAPSHOT_STORE,
  ProfileSnapshotStore,
} from './application/ports';
import { RecordLiveUpdate } from './application/record-live-update';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { BlizzardApiClient } from './infrastructure/blizzard/blizzard-api.client';
import { BlizzardCharacterProvider } from './infrastructure/blizzard/blizzard-character.provider';
import { PrismaCharacterStore } from './infrastructure/persistence/prisma-character.store';
import { PrismaService } from './infrastructure/persistence/prisma.service';
import { CharacterController } from './presentation/character.controller';
import { LiveController } from './presentation/live.controller';
import { LiveTokenGuard } from './presentation/live-token.guard';
import { SharedModule } from './shared.module';

/**
 * Composition root for the character feature: binds each port to its adapter
 * and builds the (framework-free) use cases with factories.
 */
@Module({
  imports: [SharedModule],
  controllers: [CharacterController, LiveController],
  providers: [
    {
      provide: PrismaCharacterStore,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCharacterStore(prisma),
    },
    { provide: PROFILE_SNAPSHOT_STORE, useExisting: PrismaCharacterStore },
    { provide: LEVEL_HISTORY_STORE, useExisting: PrismaCharacterStore },
    { provide: LIVE_SIGNAL_STORE, useExisting: PrismaCharacterStore },
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
        LIVE_SIGNAL_STORE,
        CLOCK,
      ],
      useFactory: (
        provider: CharacterProfileProvider,
        snapshots: ProfileSnapshotStore,
        history: LevelHistoryStore,
        live: LiveSignalStore,
        clock: Clock,
      ) =>
        new GetCharacterOverview(
          provider,
          snapshots,
          history,
          live,
          clock,
          new Logger('GetCharacterOverview'),
        ),
    },
    {
      provide: GetLevelHistory,
      inject: [LEVEL_HISTORY_STORE],
      useFactory: (history: LevelHistoryStore) => new GetLevelHistory(history),
    },
    {
      provide: RecordLiveUpdate,
      inject: [LIVE_SIGNAL_STORE, LEVEL_HISTORY_STORE, CLOCK],
      useFactory: (
        live: LiveSignalStore,
        history: LevelHistoryStore,
        clock: Clock,
      ) => new RecordLiveUpdate(live, history, clock),
    },
    LiveTokenGuard,
  ],
})
export class CharacterModule {}
