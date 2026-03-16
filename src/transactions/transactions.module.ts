import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionValidator } from './validations/transaction.validator';
import { TransferStrategy } from './strategies/transfer.strategy';
import { IncomeStrategy } from './strategies/income.strategy';
import { ExpenseStrategy } from './strategies/expense.strategy';
import { CategoriesModule } from 'src/categories/categories.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { Category } from 'src/categories/entities/category.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Category, Account]),
    CategoriesModule,
    AccountsModule,
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionValidator,
    IncomeStrategy,
    ExpenseStrategy,
    TransferStrategy,
  ],
  exports: [
    TransactionValidator,
    IncomeStrategy,
    ExpenseStrategy,
    TransferStrategy,
    TypeOrmModule,
  ],
})
export class TransactionsModule {}
