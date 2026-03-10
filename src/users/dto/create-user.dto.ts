import { Length, IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols.',
    },
  )
  password: string;

  @IsNotEmpty()
  @Length(3, 50)
  fullName: string;

  isActive: boolean;
}
