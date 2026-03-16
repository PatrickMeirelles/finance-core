import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { GetTransactionsDto } from '../dto/get-transactions.dto';
import { applyTransactionFilters } from '../../common/utils/transaction-filters.util';

type TransactionSummaryRaw = {
  income: string | null;
  expense: string | null;
};

export async function getTransactionSummary(
  repository: Repository<Transaction>,
  userId: number,
  filters: GetTransactionsDto,
) {
  const query = repository
    .createQueryBuilder('transaction')
    .select([
      `SUM(CASE WHEN transaction.type = 'income' THEN transaction.value ELSE 0 END) as income`,
      `SUM(CASE WHEN transaction.type = 'expensive' THEN transaction.value ELSE 0 END) as expense`,
    ])
    .where('transaction.user_id = :userId', { userId });

  applyTransactionFilters(query, filters);

  const result = await query.getRawOne<TransactionSummaryRaw>();

  const income = Number(result?.income ?? 0) / 100;
  const expense = Number(result?.expense ?? 0) / 100;

  return {
    income,
    expense,
    balance: income - expense,
  };
}
