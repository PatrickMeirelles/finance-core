import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TransactionValidationStrategy } from './transaction-validation.strategy';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Category } from '../../categories/entities/category.entity';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';

@Injectable()
export class ExpenseStrategy extends TransactionValidationStrategy {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {
    super();
  }

  async validate(userId: number, dto: CreateTransactionDto) {
    const { categoryId } = dto;

    if (!categoryId) {
      throw new BadRequestException('Category is required');
    }

    const category = await this.categoryRepository.findOne({
      where: {
        id: categoryId,
        user_id: userId,
        is_active: true,
        type: IncomeExpensive.EXPENSIVE,
      },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }
  }
}
