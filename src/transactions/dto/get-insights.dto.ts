import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  INSIGHTS_DEFAULT_MONTHS,
  INSIGHTS_MAX_MONTHS,
  INSIGHTS_MIN_MONTHS,
} from '../constants/insights.constants';

export class GetInsightsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(INSIGHTS_MIN_MONTHS)
  @Max(INSIGHTS_MAX_MONTHS)
  months: number = INSIGHTS_DEFAULT_MONTHS;
}
