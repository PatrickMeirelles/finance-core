import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsDateString,
  IsInt,
  IsString,
  IsIn,
  IsArray,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import { TransactionStatus } from '../entities/enum/transactions-status.enum';

export const TRANSACTION_SORTS = ['date', 'value', 'created'] as const;
export const SORT_ORDERS = ['ASC', 'DESC'] as const;
export const SEARCH_MAX_LENGTH = 64;

type TransactionSort = (typeof TRANSACTION_SORTS)[number];
type SortOrder = (typeof SORT_ORDERS)[number];

/** `?accountIds=1` arrives as a string; `?accountIds=1&accountIds=2` as an array. */
const toArray = ({ value }: { value: unknown }) =>
  value === undefined || Array.isArray(value) ? value : [value];

export class GetTransactionsDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  accountIds?: number[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsEnum(IncomeExpensive)
  type?: IncomeExpensive;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(SEARCH_MAX_LENGTH)
  search?: string;

  @IsOptional()
  @IsIn(TRANSACTION_SORTS)
  sort?: TransactionSort;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}
