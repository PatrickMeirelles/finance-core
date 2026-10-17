import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'node:path';
import {
  DEFAULT_DB_HOST,
  DEFAULT_DB_PORT,
  ENV,
  SQLITE_DEV_DATABASE,
} from './env.constants';
import { envFlag, isDevelopment } from './env.util';

/** Compiled migrations shipped next to this file (`dist/migrations`). */
export const MIGRATIONS_GLOB = join(__dirname, '..', 'migrations', '*.{js,ts}');

/**
 * Postgres connection for every environment but local development. Accepts a
 * single `DATABASE_URL` (Neon, Supabase, Render...) or the individual `DB_*`
 * variables. The schema is managed by migrations, never by `synchronize`.
 */
export function postgresOptions(config: ConfigService): TypeOrmModuleOptions {
  const url = config.get<string>(ENV.databaseUrl);
  const ssl =
    envFlag(config, ENV.dbSsl) || Boolean(url)
      ? { rejectUnauthorized: true }
      : false;

  return {
    type: 'postgres',
    ...(url
      ? { url }
      : {
          host: config.get<string>(ENV.dbHost) || DEFAULT_DB_HOST,
          port: Number(config.get<number>(ENV.dbPort)) || DEFAULT_DB_PORT,
          username: config.get<string>(ENV.dbUser),
          password: config.get<string>(ENV.dbPass),
          database: config.get<string>(ENV.dbName),
        }),
    ssl,
    synchronize: false,
    migrationsRun: true,
    migrations: [MIGRATIONS_GLOB],
    autoLoadEntities: true,
  };
}

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  if (isDevelopment(configService)) {
    return {
      type: 'better-sqlite3',
      database: SQLITE_DEV_DATABASE,
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    };
  }

  return postgresOptions(configService);
};
