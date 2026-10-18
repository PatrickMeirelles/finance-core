import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Repository } from 'typeorm';

type AccountBalanceRaw = {
  accountId: string;
  balance: string;
};

/**
 * The query alias is `tx` instead of `transaction`: TRANSACTION is a reserved
 * word in SQLite and breaks the raw SELECT expressions below in development.
 */
@Injectable()
export class AccountBalanceService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getBalanceByAccountIds(accountIds: number[]) {
    const balances = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('tx.account_id', 'accountId')
      .addSelect(
        `
        COALESCE(SUM(
          CASE 
            WHEN tx.type = 'income' THEN tx.value
            WHEN tx.type = 'expensive' THEN -tx.value
            ELSE 0
          END
        ),0)
        `,
        'balance',
      )
      .where('tx.account_id IN (:...accountIds)', { accountIds })
      .andWhere('tx.is_active = :isActive', { isActive: true })
      .groupBy('tx.account_id')
      .getRawMany<AccountBalanceRaw>();

    const map = new Map<number, number>();

    balances.forEach((b) => {
      map.set(Number(b.accountId), Number(b.balance));
    });

    return map;
  }

  async getBalanceByAccountId(accountId: number) {
    const balance = await this.transactionRepository
      .createQueryBuilder('tx')
      .select(
        `
        COALESCE(SUM(
          CASE 
            WHEN tx.type = 'income' THEN tx.value
            WHEN tx.type = 'expensive' THEN -tx.value
            ELSE 0
          END
        ),0)
        `,
        'balance',
      )
      .where('tx.account_id = :accountId', { accountId })
      .andWhere('tx.is_active = :isActive', { isActive: true })
      .getRawOne<{ balance: string }>();

    return Number(balance?.balance ?? 0);
  }
}
