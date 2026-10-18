import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { User } from 'src/users/entities/user.entity';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';

describe('CategoriesController', () => {
  const currentUser = { id: 42 } as User;
  let controller: CategoriesController;
  let service: jest.Mocked<
    Pick<CategoriesService, 'findOne' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    service = {
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: service }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('scopes read, update and delete to the authenticated user', () => {
    const dto = {
      name: 'Mercado',
      type: IncomeExpensive.EXPENSIVE,
      color: '#fff',
      icon: 'cart',
    };
    void controller.findOne(currentUser, 5);
    void controller.update(currentUser, 5, dto);
    void controller.remove(currentUser, 5);
    expect(service.findOne).toHaveBeenCalledWith(42, 5);
    expect(service.update).toHaveBeenCalledWith(42, 5, dto);
    expect(service.remove).toHaveBeenCalledWith(42, 5);
  });
});
