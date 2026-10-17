import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  /**
   * Only presence is validated: the password policy applies when a password
   * is chosen, not when it is checked, so a policy change never locks users
   * out of their own accounts.
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
