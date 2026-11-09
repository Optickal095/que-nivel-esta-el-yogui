import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Render sits behind one proxy: trust it so req.ip is the visitor's IP (comments cooldown).
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:4200' });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
