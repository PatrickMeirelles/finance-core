import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';

describe('CategoriesService ownership', () => {
  const owner = 1;
  const intruder = 2;
  const category = { id: 5, user_id: owner, is_active: true } as Category;
  let repository: jest.Mocked<Pick<Repository<Category>, 'findOne' | 'update'>>;
  let service: CategoriesService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(({ where }: { where: Partial<Category> }) =>
        Promise.resolve(
          where.id === category.id && where.user_id === owner ? category : null,
        ),
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    service = new CategoriesService(
      repository as unknown as Repository<Category>,
    );
  });

  const dto = {
    name: 'Mercado',
    type: IncomeExpensive.EXPENSIVE,
    color: '#fff',
    icon: 'cart',
  };

  it('updates a category of the caller', async () => {
    await service.update(owner, category.id, dto);
    expect(repository.update).toHaveBeenCalledWith(
      { id: category.id, user_id: owner },
      expect.objectContaining({ name: 'Mercado' }),
    );
  });

  it('refuses to update or remove a category of another user', async () => {
    await expect(service.update(intruder, category.id, dto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.remove(intruder, category.id)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
