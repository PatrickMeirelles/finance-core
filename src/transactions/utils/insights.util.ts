import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import { MONTH_KEY_LENGTH } from '../constants/insights.constants';
import { Transaction } from '../entities/transaction.entity';

export type MoneySummary = {
  /** Values in cents. */
  income: number;
  expense: number;
  balance: number;
};

export type MonthlyInsight = MoneySummary & { month: string };

export type CategoryInsight = {
  categoryId: number;
  name: string;
  color: string | null;
  icon: string | null;
  /** Expense in cents. */
  expense: number;
};

export type InsightsResponse = {
  period: { months: number; startDate: string; endDate: string };
  totals: MoneySummary;
  previousPeriod: MoneySummary;
  currentMonth: MoneySummary;
  previousMonth: MoneySummary;
  monthly: MonthlyInsight[];
  byCategory: CategoryInsight[];
};

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, MONTH_KEY_LENGTH);
}

export function startOfMonthUtc(date: Date, monthOffset = 0): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1),
  );
}

export function emptySummary(): MoneySummary {
  return { income: 0, expense: 0, balance: 0 };
}

function addToSummary(summary: MoneySummary, transaction: Transaction) {
  if (transaction.type === IncomeExpensive.INCOME) {
    summary.income += transaction.value;
  } else if (transaction.type === IncomeExpensive.EXPENSIVE) {
    summary.expense += transaction.value;
  }
  summary.balance = summary.income - summary.expense;
}

export function summarize(transactions: Transaction[]): MoneySummary {
  const summary = emptySummary();
  transactions.forEach((transaction) => addToSummary(summary, transaction));
  return summary;
}

export function buildMonthlySeries(
  transactions: Transaction[],
  startDate: Date,
  months: number,
): MonthlyInsight[] {
  const series = new Map<string, MonthlyInsight>();
  for (let i = 0; i < months; i++) {
    const key = monthKey(startOfMonthUtc(startDate, i));
    series.set(key, { month: key, ...emptySummary() });
  }
  transactions.forEach((transaction) => {
    const entry = series.get(monthKey(new Date(transaction.transaction_date)));
    if (entry) {
      addToSummary(entry, transaction);
    }
  });
  return Array.from(series.values());
}

export function buildCategoryBreakdown(
  transactions: Transaction[],
): CategoryInsight[] {
  const byCategory = new Map<number, CategoryInsight>();
  transactions
    .filter((transaction) => transaction.type === IncomeExpensive.EXPENSIVE)
    .forEach((transaction) => {
      const current = byCategory.get(transaction.category_id) ?? {
        categoryId: transaction.category_id,
        name: transaction.category?.name ?? '',
        color: transaction.category?.color ?? null,
        icon: transaction.category?.icon ?? null,
        expense: 0,
      };
      current.expense += transaction.value;
      byCategory.set(transaction.category_id, current);
    });
  return Array.from(byCategory.values()).sort((a, b) => b.expense - a.expense);
}
