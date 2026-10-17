import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { DEFAULT_PORT, ENV } from './config/env.constants';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  await app.listen(process.env[ENV.port] ?? DEFAULT_PORT, '0.0.0.0');
}
void bootstrap();
