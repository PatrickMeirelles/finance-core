import { SelectQueryBuilder } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

const ALLOWED_SORTS = {
  date: 'transaction.transaction_date',
  value: 'transaction.value',
  created: 'transaction.created_at',
} as const;

type SortKey = keyof typeof ALLOWED_SORTS;

export function applyTransactionSort(
  query: SelectQueryBuilder<Transaction>,
  sort?: string,
  order: 'ASC' | 'DESC' = 'DESC',
) {
  const safeSort: SortKey =
    sort && sort in ALLOWED_SORTS ? (sort as SortKey) : 'date';

  const column = ALLOWED_SORTS[safeSort];

  query.orderBy(column, order.toUpperCase() as 'ASC' | 'DESC');

  return query;
}
