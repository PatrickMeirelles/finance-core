import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Account } from '../../accounts/entities/account.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';

import { IncomeStrategy } from '../strategies/income.strategy';
import { ExpenseStrategy } from '../strategies/expense.strategy';
import { TransferStrategy } from '../strategies/transfer.strategy';
import { Category } from 'src/categories/entities/category.entity';

@Injectable()
export class TransactionValidator {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private incomeStrategy: IncomeStrategy,
    private expenseStrategy: ExpenseStrategy,
    private transferStrategy: TransferStrategy,
  ) {}

  async validateTransaction(userId: number, dto: CreateTransactionDto) {
    const { value, type, destinationAcccountId, categoryId } = dto;

    if (value <= 0) {
      throw new BadRequestException('Value must be greater than 0');
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: categoryId,
          user_id: userId,
          is_active: true,
        },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }
    if (destinationAcccountId) {
      const destinationAccount = await this.accountRepository.findOne({
        where: {
          id: destinationAcccountId,
          user_id: userId,
          is_active: true,
        },
      });

      if (!destinationAccount) {
        throw new BadRequestException('Destination account not found');
      }
    }

    const strategies = {
      [IncomeExpensive.INCOME]: this.incomeStrategy,
      [IncomeExpensive.EXPENSIVE]: this.expenseStrategy,
      [IncomeExpensive.TRANSFER]: this.transferStrategy,
    };

    const strategy = strategies[type];

    if (!strategy) {
      throw new BadRequestException('Invalid transaction type');
    }

    await strategy.validate(userId, dto);

    return dto;
  }
}
