import { BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { Category } from 'src/categories/entities/category.entity';
import { TransactionValidator } from './validations/transaction.validator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import { TransactionStatus } from './entities/enum/transactions-status.enum';

describe('TransactionsService ownership', () => {
  const owner = 1;
  const intruder = 2;
  const account = { id: 10, user_id: owner, is_active: true } as Account;
  const category = { id: 20, user_id: owner, is_active: true } as Category;

  const owned =
    <T extends { id: number; user_id: number }>(row: T) =>
    ({ where }: { where: Partial<T> }) =>
      Promise.resolve(
        where.id === row.id && where.user_id === row.user_id ? row : null,
      );

  let transactionRepository: {
    find: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let accountRepository: { findOne: jest.Mock };
  let categoryRepository: { findOne: jest.Mock };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: { getRepository: jest.Mock };
  };
  let service: TransactionsService;

  beforeEach(() => {
    transactionRepository = {
      find: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn((row: Partial<Transaction>) => row),
      save: jest.fn((rows: Transaction[]) => Promise.resolve(rows)),
    };
    accountRepository = { findOne: jest.fn(owned(account)) };
    categoryRepository = { findOne: jest.fn(owned(category)) };
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        getRepository: jest.fn((entity: unknown) =>
          entity === Account ? accountRepository : transactionRepository,
        ),
      },
    };
    const dataSource = {
      createQueryRunner: () => queryRunner,
      options: { type: 'postgres' },
    } as unknown as DataSource;
    service = new TransactionsService(
      transactionRepository as unknown as Repository<Transaction>,
      categoryRepository as unknown as Repository<Category>,
      accountRepository as unknown as Repository<Account>,
      { validateTransaction: jest.fn() } as unknown as TransactionValidator,
      dataSource,
    );
  });

  const dto: CreateTransactionDto = {
    accountId: account.id,
    categoryId: category.id,
    value: 1000,
    type: IncomeExpensive.EXPENSIVE,
    status: TransactionStatus.COMPLETED,
    installment: 1,
    amountInstallments: 1,
    description: 'Mercado',
    transactionDate: new Date('2026-10-01T00:00:00Z'),
  } as CreateTransactionDto;

  it('creates a transaction on an account owned by the caller', async () => {
    const result = await service.transactionAcidCreate(owner, dto);
    expect(result).toHaveLength(1);
    expect(accountRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: account.id, user_id: owner, is_active: true },
      }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('refuses to post into an account of another user and rolls back', async () => {
    await expect(service.transactionAcidCreate(intruder, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('removes only transactions of the caller', async () => {
    transactionRepository.find.mockImplementation(
      ({ where }: { where: Partial<Transaction> }) =>
        Promise.resolve(where.user_id === owner ? [{ id: 1 }] : []),
    );
    await expect(service.remove(intruder, 'group-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepository.update).not.toHaveBeenCalled();

    await service.remove(owner, 'group-1');
    expect(transactionRepository.update).toHaveBeenCalledWith(
      { installments_group_id: 'group-1', user_id: owner },
      { is_active: false },
    );
  });

  it('rejects an update that points to another user account or category', async () => {
    await expect(
      service.update(intruder, 1, undefined, {
        accountId: account.id,
        categoryId: category.id,
        status: TransactionStatus.COMPLETED,
      } as never),
    ).rejects.toThrow(BadRequestException);
    expect(transactionRepository.update).not.toHaveBeenCalled();
  });

  it('maps an update to database columns only', async () => {
    await service.update(owner, 1, undefined, {
      accountId: account.id,
      categoryId: category.id,
      status: TransactionStatus.PENDING,
      description: 'Feira',
    });
    expect(transactionRepository.update).toHaveBeenCalledWith(
      { id: 1, user_id: owner, is_active: true },
      {
        account_id: account.id,
        category_id: category.id,
        status: TransactionStatus.PENDING,
        description: 'Feira',
      },
    );
  });
});
