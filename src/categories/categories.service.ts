import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  normalizeAccountData(dto: CreateCategoryDto | UpdateCategoryDto) {
    return {
      name: dto.name,
      type: dto.type,
      color: dto.color,
      icon: dto.icon,
    };
  }

  async create(userId: number, createCategoryDto: CreateCategoryDto) {
    const checkCategory = await this.categoryRepository.findOne({
      where: {
        name: createCategoryDto.name,
        user_id: userId,
        type: createCategoryDto.type,
        is_active: true,
      },
    });
    if (checkCategory) {
      throw new BadRequestException(
        'Category name already exists to this type category for this user',
      );
    }
    const category: Partial<Category> = this.categoryRepository.create({
      ...createCategoryDto,
      user_id: userId,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(userId: number) {
    return await this.categoryRepository.find({
      where: { user_id: userId, is_active: true },
    });
  }

  async findOne(userId: number, id: number) {
    const getCategory = await this.categoryRepository.findOne({
      where: { id, is_active: true, user_id: userId },
    });
    if (!getCategory) {
      throw new BadRequestException('Category not found');
    }
    return getCategory;
  }

  async update(id: number, updateAccountDto: UpdateCategoryDto) {
    const getCategory = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!getCategory) {
      throw new BadRequestException('Category not found');
    }

    const categoryData = await this.categoryRepository.update(
      id,
      this.normalizeAccountData(updateAccountDto),
    );

    if (categoryData.affected === 0) {
      throw new BadRequestException('Category not found or no changes made');
    }
    await this.categoryRepository.findOne({ where: { id } });
    return { message: 'Category updated successfully' };
  }

  async remove(id: number) {
    const getCategory = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!getCategory) {
      throw new BadRequestException('Category not found');
    }
    await this.categoryRepository.update(id, { is_active: false });
    return { message: 'Category removed successfully' };
  }
}
