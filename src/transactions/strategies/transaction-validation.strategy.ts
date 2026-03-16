import { CreateTransactionDto } from '../dto/create-transaction.dto';

export abstract class TransactionValidationStrategy {
  abstract validate(userId: number, dto: CreateTransactionDto): Promise<void>;
}
