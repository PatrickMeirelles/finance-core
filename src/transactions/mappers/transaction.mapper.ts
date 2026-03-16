import { CreateTransactionDto } from '../dto/create-transaction.dto';

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
}
