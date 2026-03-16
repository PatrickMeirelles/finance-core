import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { TransactionStatus } from '../entities/enum/transactions-status.enum';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
export class CreateTransactionDto {
  @IsNotEmpty()
  @IsInt()
  accountId: number;

  @IsNotEmpty()
  @IsInt()
  categoryId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  value: number;

  @IsEnum(IncomeExpensive, {
    message: `Type must be one of the following: ${Object.values(IncomeExpensive).join(', ')}`,
  })
  type: IncomeExpensive;

  @IsEnum(TransactionStatus, {
    message: `Status must be one of the following: ${Object.values(TransactionStatus).join(', ')}`,
  })
  status: TransactionStatus;

  @IsNotEmpty()
  @IsInt()
  installment: number;

  @IsNotEmpty()
  @IsInt()
  amountInstallments: number;

  @IsOptional()
  @IsNumber()
  destinationAcccountId: number;

  installmentsGroupId: string;

  @IsOptional()
  @IsString()
  @Length(3, 64)
  description: string;

  transactionDate: Date;
}
