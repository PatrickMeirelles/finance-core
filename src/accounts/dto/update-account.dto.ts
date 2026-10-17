import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';

/** Same fields and rules as creation; every field is optional. */
export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
