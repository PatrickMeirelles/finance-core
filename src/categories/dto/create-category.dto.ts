import { IsEnum, IsNotEmpty, Length } from 'class-validator';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';

export class CreateCategoryDto {
  @IsNotEmpty()
  @Length(3, 20)
  name: string;

  @IsEnum(IncomeExpensive, {
    message: `Type must be one of the following: ${Object.values(IncomeExpensive).join(', ')}`,
  })
  type: IncomeExpensive;
  icon: string;
  color: string;
}
