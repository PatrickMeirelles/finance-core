import { IsOptional, Length } from 'class-validator';

/** Only the display names can be changed here; e-mail and password have their own flows. */
export class UpdateUserDto {
  @IsOptional()
  @Length(3, 20)
  name?: string;

  @IsOptional()
  @Length(3, 50)
  fullName?: string;
}
