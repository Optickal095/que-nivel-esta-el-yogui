import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CharacterModule } from './character.module';

// The compiled Angular app (web/dist). Served by Nest so the whole site is one URL.
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
  ],
})
export class AppModule {}
