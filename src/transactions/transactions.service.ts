import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionValidator } from './validations/transaction.validator';
import { TransactionMapper } from './mappers/transaction.mapper';
import { runInTransaction } from 'src/common/utils/transaction.util';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import { randomUUID } from 'node:crypto';
import { generateInstallments } from 'src/common/utils/installment.util';
import { User } from 'src/users/entities/user.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { getPagination } from 'src/common/utils/pagination.util';
import { applyTransactionFilters } from 'src/common/utils/transaction-filters.util';
import { applyTransactionSort } from './utils/sort.util';
import { getTransactionSummary } from './utils/transaction-summary.util';

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
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new BadRequestException('Account not found');
      }

      if (dto.type === IncomeExpensive.TRANSFER && dto.destinationAcccountId) {
        await accountRepository.findOne({
          where: { id: dto.destinationAcccountId },
          lock: { mode: 'pessimistic_write' },
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
      .where('transaction.user_id = :userId', { userId: currentUser.id });

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
