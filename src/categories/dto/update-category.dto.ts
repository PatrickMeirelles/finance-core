import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

/** Same fields and rules as creation; every field is optional. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
