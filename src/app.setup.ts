import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptors/response.interceptor';
import {
  CORS_ALLOW_ANY_ORIGIN,
  CORS_ORIGINS_SEPARATOR,
} from './common/constants/security.constants';
import { ENV } from './config/env.constants';

/** Origins allowed by CORS: a comma-separated list, or any origin when unset. */
export function corsOrigins(config: ConfigService): string[] | string {
  const raw = config.get<string>(ENV.corsOrigins);
  if (!raw || raw.trim() === CORS_ALLOW_ANY_ORIGIN) {
    return CORS_ALLOW_ANY_ORIGIN;
  }
  return raw
    .split(CORS_ORIGINS_SEPARATOR)
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Everything the HTTP layer needs regardless of how the app is hosted
 * (long-running process in `main.ts` or serverless function in
 * `serverless.ts`).
 */
export function configureApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService);
  app.use(helmet());
  app.enableCors({ origin: corsOrigins(config) });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Unknown properties are dropped before reaching services.
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new GlobalResponseInterceptor());
  return app;
}
