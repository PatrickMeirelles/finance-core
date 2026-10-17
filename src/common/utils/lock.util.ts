import { DataSource, FindOneOptions, ObjectLiteral } from 'typeorm';
import { DRIVERS_WITHOUT_ROW_LOCKS } from '../constants/database.constants';

/**
 * Row locks keep concurrent writes on the same account consistent in
 * Postgres. SQLite (development) serializes writers itself and rejects the
 * lock clause, so no lock is requested there.
 */
export function pessimisticWriteLock<T extends ObjectLiteral>(
  dataSource: DataSource,
): Pick<FindOneOptions<T>, 'lock'> {
  if (DRIVERS_WITHOUT_ROW_LOCKS.includes(dataSource.options.type)) {
    return {};
  }
  return { lock: { mode: 'pessimistic_write' } };
}
