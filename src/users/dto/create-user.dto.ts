import {
  Length,
  IsEmail,
  IsNotEmpty,
  IsStrongPassword,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import {
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
} from 'src/common/constants/security.constants';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE })
  password: string;

  @IsNotEmpty()
  @Length(3, 50)
  fullName: string;

  /** Seeds the default wallet account and categories for the new user. */
  @IsOptional()
  @IsBoolean()
  initializeWithDefaultData?: boolean;
}
