import { SelectQueryBuilder } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { GetTransactionsDto } from '../../transactions/dto/get-transactions.dto';

export function applyTransactionFilters(
  query: SelectQueryBuilder<Transaction>,
  filters: GetTransactionsDto,
) {
  const {
    startDate,
    endDate,
    accountIds,
    categoryIds,
    type,
    status,
    minValue,
    maxValue,
    search,
  } = filters;

  if (startDate) {
    query.andWhere('transaction.transaction_date >= :startDate', { startDate });
  }

  if (endDate) {
    query.andWhere('transaction.transaction_date <= :endDate', { endDate });
  }

  if (accountIds?.length) {
    query.andWhere('transaction.account_id IN (:...accountIds)', {
      accountIds,
    });
  }

  if (categoryIds?.length) {
    query.andWhere('transaction.category_id IN (:...categoryIds)', {
      categoryIds,
    });
  }

  if (type) {
    query.andWhere('transaction.type = :type', { type });
  }

  if (status) {
    query.andWhere('transaction.status = :status', { status });
  }

  if (minValue) {
    query.andWhere('transaction.value >= :minValue', { minValue });
  }

  if (maxValue) {
    query.andWhere('transaction.value <= :maxValue', { maxValue });
  }

  if (search) {
    query.andWhere('LOWER(transaction.description) LIKE LOWER(:search)', {
      search: `%${search}%`,
    });
  }

  return query;
}
