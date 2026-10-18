import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { Transaction } from '../entities/transaction.entity';

export class TransactionMapper {
  static toEntity(userId: number, dto: CreateTransactionDto) {
    return {
      user_id: userId,
      account_id: dto.accountId,
      category_id: dto.categoryId,
      status: dto.status,
      destination_account_id: dto.destinationAcccountId,
      value: dto.value,
      type: dto.type,
      description: dto.description,
      installment: dto.installment,
      amount_installments: dto.amountInstallments,
      transaction_date: dto.transactionDate,
      installments_group_id: dto.installmentsGroupId,
    };
  }

  /** Only the editable columns; ownership, type and installments never change here. */
  static toUpdateColumns(dto: UpdateTransactionDto): Partial<Transaction> {
    return {
      account_id: dto.accountId,
      category_id: dto.categoryId,
      status: dto.status,
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.value !== undefined && { value: dto.value }),
      ...(dto.transactionDate !== undefined && {
        transaction_date: dto.transactionDate,
      }),
    };
  }
}
