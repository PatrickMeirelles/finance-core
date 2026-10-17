import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'node:path';
import { postgresOptions } from './database';

/**
 * DataSource for the TypeORM CLI (`pnpm migration:generate`, `migration:run`).
 * Uses the same Postgres options as the running API, with the entities
 * resolved from source so new migrations can be generated before a build.
 */
const config = new ConfigService(process.env);
const options = postgresOptions(config) as DataSourceOptions;

export default new DataSource({
  ...options,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
  migrationsRun: false,
});
