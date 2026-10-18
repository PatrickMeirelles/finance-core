import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import {
  PASSWORD_POLICY,
  PASSWORD_POLICY_MESSAGE,
} from 'src/common/constants/security.constants';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @IsStrongPassword(PASSWORD_POLICY, { message: PASSWORD_POLICY_MESSAGE })
  password: string;
}
