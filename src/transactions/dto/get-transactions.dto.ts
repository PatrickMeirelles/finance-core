import { Type } from 'class-transformer';
import {
  IsOptional,
  IsDateString,
  IsInt,
  IsString,
  IsIn,
  IsArray,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

type TransactionSort = 'date' | 'value' | 'created';

export class GetTransactionsDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  accountIds?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  type?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  minValue?: number;

  @IsOptional()
  @Type(() => Number)
  maxValue?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['date', 'value', 'created'])
  sort?: TransactionSort;

  @IsOptional()
  order?: 'ASC' | 'DESC';
}
