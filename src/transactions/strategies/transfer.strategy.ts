import { BadRequestException, Injectable } from '@nestjs/common';

import { TransactionValidationStrategy } from './transaction-validation.strategy';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class TransferStrategy extends TransactionValidationStrategy {
  validate(userId: number, dto: CreateTransactionDto): Promise<void> {
    const { accountId, destinationAcccountId } = dto;

    if (!destinationAcccountId) {
      throw new BadRequestException('Destination account is required');
    }

    if (accountId === destinationAcccountId) {
      throw new BadRequestException(
        'Source and destination accounts cannot be the same',
      );
    }

    return Promise.resolve();
  }
}
