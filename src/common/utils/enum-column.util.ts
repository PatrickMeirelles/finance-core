import { ColumnType } from 'typeorm';
import { DEVELOPMENT_ENV } from '../constants/environment.constants';

/**
 * SQLite (used when NODE_ENV=development) has no native enum type, so TypeORM
 * refuses to start with `type: 'enum'`. `simple-enum` is stored as a varchar
 * with a CHECK constraint and works on SQLite; Postgres keeps the native enum
 * so no schema change happens in the other environments.
 */
export function enumColumnType(): ColumnType {
  return process.env.NODE_ENV === DEVELOPMENT_ENV ? 'simple-enum' : 'enum';
}
