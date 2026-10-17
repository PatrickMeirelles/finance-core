import {
  Length,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { PaymentMethod } from '../entities/enum/payment-method.enum';
import {
  DAY_OF_MONTH_MAX,
  DAY_OF_MONTH_MIN,
} from 'src/common/constants/validation.constants';

export class CreateAccountDto {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;

  @IsEnum(PaymentMethod, {
    message: `Type must be one of the following: ${Object.values(PaymentMethod).join(', ')}`,
  })
  type: PaymentMethod;

  @IsOptional()
  @IsInt()
  @Min(DAY_OF_MONTH_MIN)
  @Max(DAY_OF_MONTH_MAX)
  closing_day?: number;

  @IsOptional()
  @IsInt()
  @Min(DAY_OF_MONTH_MIN)
  @Max(DAY_OF_MONTH_MAX)
  due_day?: number;

  /** Credit limit in cents. */
  @IsOptional()
  @IsInt()
  @Min(0)
  credit_limit?: number;
}
