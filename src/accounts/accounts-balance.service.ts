import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Repository } from 'typeorm';

type AccountBalanceRaw = {
  accountId: string;
  balance: string;
};

@Injectable()
export class AccountBalanceService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getBalanceByAccountIds(accountIds: number[]) {
    const balances = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.account_id', 'accountId')
      .addSelect(
        `
        COALESCE(SUM(
          CASE 
            WHEN transaction.type = 'income' THEN transaction.value
            WHEN transaction.type = 'expensive' THEN -transaction.value
            ELSE 0
          END
        ),0)
        `,
        'balance',
      )
      .where('transaction.account_id IN (:...accountIds)', { accountIds })
      .groupBy('transaction.account_id')
      .getRawMany<AccountBalanceRaw>();

    const map = new Map<number, number>();

    balances.forEach((b) => {
      map.set(Number(b.accountId), Number(b.balance) / 100);
    });

    return map;
  }

  async getBalanceByAccountId(accountId: number) {
    const balance = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(
        `
        COALESCE(SUM(
          CASE 
            WHEN transaction.type = 'income' THEN transaction.value
            WHEN transaction.type = 'expensive' THEN -transaction.value
            ELSE 0
          END
        ),0)
        `,
        'balance',
      )
      .where('transaction.account_id = :accountId', { accountId })
      .getRawOne<{ balance: string }>();

    return Number(balance?.balance ?? 0) / 100;
  }
}
