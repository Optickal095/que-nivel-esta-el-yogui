import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLOCK } from './application/ports';
import { APP_CONFIG, loadAppConfig } from './config/app-config';
import { PrismaService } from './infrastructure/persistence/prisma.service';
import { SystemClock } from './infrastructure/system-clock';

/** What every feature module shares: config, the single database connection and the clock. */
@Module({
  providers: [
    { provide: APP_CONFIG, inject: [ConfigService], useFactory: loadAppConfig },
    PrismaService,
    { provide: CLOCK, useClass: SystemClock },
  ],
  exports: [APP_CONFIG, PrismaService, CLOCK],
})
export class SharedModule {}
