import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';
import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { TransactionStatus } from '../entities/enum/transactions-status.enum';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @IsNotEmpty()
  @IsInt()
  accountId: number;

  @IsNotEmpty()
  @IsInt()
  categoryId: number;

  @IsEnum(TransactionStatus, {
    message: `Status must be one of the following: ${Object.values(TransactionStatus).join(', ')}`,
  })
  status: TransactionStatus;

  @IsOptional()
  @IsString()
  @Length(3, 64)
  description: string;
}
