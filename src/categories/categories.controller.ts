import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from 'src/common/decorators/current.user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('create')
  create(
    @CurrentUser() currentUser: User,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(currentUser.id, createCategoryDto);
  }

  @Get()
  findAll(@CurrentUser() currentUser: User) {
    return this.categoriesService.findAll(currentUser.id);
  }

  @Get(':id')
  findOne(@CurrentUser() currentUser: User, @Param('id') id: string) {
    return this.categoriesService.findOne(currentUser.id, +id);
  }

  @Patch('update/:id')
  update(
    @Param('id') id: string,
    @Body() UpdateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, UpdateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
