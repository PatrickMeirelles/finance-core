import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import { Transaction } from '../entities/transaction.entity';
import {
  buildCategoryBreakdown,
  buildMonthlySeries,
  summarize,
} from './insights.util';

function tx(partial: Partial<Transaction>): Transaction {
  return { ...partial } as Transaction;
}

describe('insights.util', () => {
  const transactions = [
    tx({
      type: IncomeExpensive.INCOME,
      value: 200000,
      transaction_date: new Date('2026-09-05T00:00:00Z'),
      category_id: 1,
    }),
    tx({
      type: IncomeExpensive.EXPENSIVE,
      value: 5000,
      transaction_date: new Date('2026-09-10T00:00:00Z'),
      category_id: 2,
      category: {
        name: 'Alimentação',
        color: '#F03913',
      } as Transaction['category'],
    }),
    tx({
      type: IncomeExpensive.EXPENSIVE,
      value: 7500,
      transaction_date: new Date('2026-10-02T00:00:00Z'),
      category_id: 2,
      category: {
        name: 'Alimentação',
        color: '#F03913',
      } as Transaction['category'],
    }),
    tx({
      type: IncomeExpensive.TRANSFER,
      value: 999,
      transaction_date: new Date('2026-10-02T00:00:00Z'),
      category_id: 3,
    }),
  ];

  it('summarizes income, expense and balance ignoring transfers', () => {
    expect(summarize(transactions)).toEqual({
      income: 200000,
      expense: 12500,
      balance: 187500,
    });
  });

  it('builds one entry per month in the period, oldest first', () => {
    const series = buildMonthlySeries(
      transactions,
      new Date('2026-08-01T00:00:00Z'),
      3,
    );
    expect(series.map((m) => m.month)).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(series[1]).toMatchObject({ income: 200000, expense: 5000 });
    expect(series[2]).toMatchObject({ income: 0, expense: 7500 });
  });

  it('groups expenses by category sorted by amount', () => {
    expect(buildCategoryBreakdown(transactions)).toEqual([
      {
        categoryId: 2,
        name: 'Alimentação',
        color: '#F03913',
        icon: null,
        expense: 12500,
      },
    ]);
  });
});
