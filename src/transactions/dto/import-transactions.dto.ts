import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * Multipart form fields sent together with the statement file. Every parsed
 * row becomes a completed transaction on `accountId`; negative amounts use
 * `expenseCategoryId` and positive amounts use `incomeCategoryId`.
 */
export class ImportTransactionsDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  accountId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  expenseCategoryId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  incomeCategoryId: number;
}
