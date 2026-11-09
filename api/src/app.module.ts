import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CharacterModule } from './character.module';
import { CommentsModule } from './comments.module';
import { HealthController } from './presentation/health.controller';

// The compiled Angular app (web/dist), served by Nest when present (local "one URL" mode).
// In production the web lives on GitHub Pages and this folder does not exist on Render.
const WEB_DIST = join(__dirname, '..', '..', 'web', 'dist', 'web', 'browser');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(existsSync(WEB_DIST)
      ? [
          ServeStaticModule.forRoot({
            rootPath: WEB_DIST,
            exclude: ['/api/{*path}'],
          }),
        ]
      : []),
    CharacterModule,
    CommentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
