import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionValidator } from './validations/transaction.validator';
import { TransactionMapper } from './mappers/transaction.mapper';
import { runInTransaction } from 'src/common/utils/transaction.util';
import { pessimisticWriteLock } from 'src/common/utils/lock.util';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import { randomUUID } from 'node:crypto';
import { generateInstallments } from 'src/common/utils/installment.util';
import { User } from 'src/users/entities/user.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { getPagination } from 'src/common/utils/pagination.util';
import { applyTransactionFilters } from 'src/common/utils/transaction-filters.util';
import { applyTransactionSort } from './utils/sort.util';
import { getTransactionSummary } from './utils/transaction-summary.util';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { GetInsightsDto } from './dto/get-insights.dto';
import { TransactionStatus } from './entities/enum/transactions-status.enum';
import { parseStatementFile } from './parsers/statement-parser';
import { ParsedStatementRow } from './parsers/statement-parser.types';
import {
  DEFAULT_IMPORT_DESCRIPTION,
  IMPORT_DESCRIPTION_MAX_LENGTH,
} from './constants/import.constants';
import {
  buildCategoryBreakdown,
  buildMonthlySeries,
  InsightsResponse,
  startOfMonthUtc,
  summarize,
} from './utils/insights.util';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private transactionValidator: TransactionValidator,
    private dataSource: DataSource,
  ) {}

  async transactionAcidCreate(userId: number, dto: CreateTransactionDto) {
    return runInTransaction(this.dataSource, async (queryRunner) => {
      const accountRepository = queryRunner.manager.getRepository(Account);
      const transactionRepository =
        queryRunner.manager.getRepository(Transaction);

      const account = await accountRepository.findOne({
        where: { id: dto.accountId },
        ...pessimisticWriteLock<Account>(this.dataSource),
      });

      if (!account) {
        throw new BadRequestException('Account not found');
      }

      if (dto.type === IncomeExpensive.TRANSFER && dto.destinationAcccountId) {
        await accountRepository.findOne({
          where: { id: dto.destinationAcccountId },
          ...pessimisticWriteLock<Account>(this.dataSource),
        });
      }

      const groupId = randomUUID();

      let transactions: Transaction[] = [];

      if (dto.amountInstallments > 1) {
        const installments = generateInstallments({
          value: dto.value,
          installment: dto.installment,
          amountInstallments: dto.amountInstallments,
          transactionDate: dto.transactionDate,
          status: dto.status,
        });

        transactions = installments.map((installment) =>
          transactionRepository.create(
            TransactionMapper.toEntity(userId, {
              ...dto,
              ...installment,
              installmentsGroupId: groupId,
            } as CreateTransactionDto),
          ),
        );
      } else {
        transactions.push(
          transactionRepository.create(
            TransactionMapper.toEntity(userId, {
              ...dto,
              installmentsGroupId: groupId,
            } as CreateTransactionDto),
          ),
        );
      }

      await transactionRepository.save(transactions);

      return transactions;
    });
  }

  async create(userId: number, dto: CreateTransactionDto) {
    await this.transactionValidator.validateTransaction(userId, dto);

    const saveTransaction = await this.transactionAcidCreate(userId, dto);

    return {
      message: 'Transaction created successfully',
      transaction: saveTransaction,
    };
  }

  async getTransactions(currentUser: User, filters: GetTransactionsDto) {
    const { page = 1, limit = 10, sort, order } = filters;

    const { take, skip } = getPagination(page, limit);

    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.user_id = :userId', { userId: currentUser.id })
      .andWhere('transaction.is_active = :isActive', { isActive: true });

    applyTransactionFilters(query, filters);

    applyTransactionSort(query, sort, order);

    query.distinct(true);

    query.take(take).skip(skip);

    const [transactions, total] = await query.getManyAndCount();

    const summary = await getTransactionSummary(
      this.transactionRepository,
      currentUser.id,
      filters,
    );

    return {
      data: {
        summary,
        transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(userId: number, id: number) {
    const getTransaction = await this.transactionRepository.findOne({
      where: { id, is_active: true, user_id: userId },
    });
    if (!getTransaction) {
      throw new BadRequestException('Transaction not found');
    }
    return getTransaction;
  }

  async update(
    userId: number,
    id: number,
    installmentGroupId: string | undefined,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const whereCondition = installmentGroupId
      ? {
          installments_group_id: installmentGroupId,
          user_id: userId,
          is_active: true,
        }
      : {
          id,
          user_id: userId,
          is_active: true,
        };

    const result = await this.transactionRepository.update(
      whereCondition,
      updateTransactionDto,
    );

    if (!result.affected) {
      throw new BadRequestException(
        'Transactions not found or no changes made',
      );
    }

    return {
      message: installmentGroupId
        ? 'Installments updated successfully'
        : 'Transaction updated successfully',
    };
  }

  private async assertImportTargets(
    userId: number,
    dto: ImportTransactionsDto,
  ) {
    const account = await this.accountRepository.findOne({
      where: { id: dto.accountId, user_id: userId, is_active: true },
    });
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const [expenseCategory, incomeCategory] = await Promise.all([
      this.categoryRepository.findOne({
        where: {
          id: dto.expenseCategoryId,
          user_id: userId,
          is_active: true,
          type: IncomeExpensive.EXPENSIVE,
        },
      }),
      this.categoryRepository.findOne({
        where: {
          id: dto.incomeCategoryId,
          user_id: userId,
          is_active: true,
          type: IncomeExpensive.INCOME,
        },
      }),
    ]);
    if (!expenseCategory) {
      throw new BadRequestException('Expense category not found');
    }
    if (!incomeCategory) {
      throw new BadRequestException('Income category not found');
    }
  }

  private rowToTransaction(
    userId: number,
    dto: ImportTransactionsDto,
    row: ParsedStatementRow,
  ): Partial<Transaction> {
    const isExpense = row.amountInCents < 0;
    const description = row.description.trim() || DEFAULT_IMPORT_DESCRIPTION;
    return {
      user_id: userId,
      account_id: dto.accountId,
      category_id: isExpense ? dto.expenseCategoryId : dto.incomeCategoryId,
      type: isExpense ? IncomeExpensive.EXPENSIVE : IncomeExpensive.INCOME,
      status: TransactionStatus.COMPLETED,
      value: Math.abs(row.amountInCents),
      description: description.slice(0, IMPORT_DESCRIPTION_MAX_LENGTH),
      transaction_date: row.date,
      installment: 1,
      amount_installments: 1,
      installments_group_id: randomUUID(),
    };
  }

  async importStatement(
    userId: number,
    dto: ImportTransactionsDto,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Statement file is required');
    }

    await this.assertImportTargets(userId, dto);

    const parsed = parseStatementFile(
      file.originalname,
      file.buffer.toString('utf8'),
    );

    if (parsed.rows.length === 0) {
      throw new BadRequestException('No transactions found in the file');
    }

    const saved = await runInTransaction(this.dataSource, (queryRunner) => {
      const repository = queryRunner.manager.getRepository(Transaction);
      const entities = parsed.rows.map((row) =>
        repository.create(this.rowToTransaction(userId, dto, row)),
      );
      return repository.save(entities);
    });

    return {
      message: `Imported ${saved.length} transactions`,
      data: {
        imported: saved.length,
        skipped: parsed.skipped,
        transactions: saved,
      },
    };
  }

  async getInsights(
    userId: number,
    dto: GetInsightsDto,
  ): Promise<{ data: InsightsResponse }> {
    const now = new Date();
    const currentMonthStart = startOfMonthUtc(now);
    const periodStart = startOfMonthUtc(now, -(dto.months - 1));
    const previousPeriodStart = startOfMonthUtc(now, -(2 * dto.months - 1));
    const previousMonthStart = startOfMonthUtc(now, -1);

    const transactions = await this.transactionRepository.find({
      where: {
        user_id: userId,
        is_active: true,
        transaction_date: MoreThanOrEqual(previousPeriodStart),
      },
      relations: ['category'],
      order: { transaction_date: 'ASC' },
    });

    const inRange = (from: Date, to?: Date) =>
      transactions.filter((transaction) => {
        const date = new Date(transaction.transaction_date);
        return date >= from && (!to || date < to);
      });

    const periodTransactions = inRange(periodStart);
    const currentMonthTransactions = inRange(currentMonthStart);

    return {
      data: {
        period: {
          months: dto.months,
          startDate: periodStart.toISOString(),
          endDate: now.toISOString(),
        },
        totals: summarize(periodTransactions),
        previousPeriod: summarize(inRange(previousPeriodStart, periodStart)),
        currentMonth: summarize(currentMonthTransactions),
        previousMonth: summarize(
          inRange(previousMonthStart, currentMonthStart),
        ),
        monthly: buildMonthlySeries(
          periodTransactions,
          periodStart,
          dto.months,
        ),
        byCategory: buildCategoryBreakdown(currentMonthTransactions),
      },
    };
  }

  async remove(installmentsGroupId: string) {
    const findTransactions = await this.transactionRepository.find({
      where: { installments_group_id: installmentsGroupId, is_active: true },
    });
    if (!findTransactions) {
      throw new BadRequestException('Transactions not found');
    }
    await this.transactionRepository.update(
      { installments_group_id: installmentsGroupId },
      {
        is_active: false,
      },
    );
    const lengthOfTransactions =
      findTransactions.length <= 1 ? 'transaction' : 'transactions';
    return `Deleted: ${findTransactions.length} ${lengthOfTransactions}`;
  }
}
