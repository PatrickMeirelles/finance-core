import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';
import { Length, IsNotEmpty, IsEnum } from 'class-validator';
import { PaymentMethod } from '../entities/enum/payment-method.enum';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;

  @IsEnum(PaymentMethod, {
    message: `Type must be one of the following: ${Object.values(PaymentMethod).join(', ')}`,
  })
  type: PaymentMethod;
  closing_day?: number;
  due_day?: number;
  credit_limit?: number;
}
