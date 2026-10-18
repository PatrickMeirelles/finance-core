import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';
import {
  HEX_COLOR_MESSAGE,
  HEX_COLOR_REGEX,
  ICON_MAX_LENGTH,
} from 'src/common/constants/validation.constants';

export class CreateCategoryDto {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;

  @IsEnum(IncomeExpensive, {
    message: `Type must be one of the following: ${Object.values(IncomeExpensive).join(', ')}`,
  })
  type: IncomeExpensive;

  @IsOptional()
  @IsString()
  @MaxLength(ICON_MAX_LENGTH)
  icon?: string;

  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: HEX_COLOR_MESSAGE })
  color?: string;
}
