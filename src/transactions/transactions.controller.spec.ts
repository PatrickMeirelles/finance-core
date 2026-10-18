import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { User } from 'src/users/entities/user.entity';
import { TransactionStatus } from './entities/enum/transactions-status.enum';

describe('TransactionsController', () => {
  const currentUser = { id: 42 } as User;
  let controller: TransactionsController;
  let service: jest.Mocked<
    Pick<TransactionsService, 'findOne' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    service = {
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: service }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('scopes read, update and delete to the authenticated user', () => {
    const dto = {
      accountId: 1,
      categoryId: 2,
      status: TransactionStatus.COMPLETED,
    } as never;
    void controller.findOne(currentUser, 7);
    void controller.update(currentUser, 7, 'group-1', dto);
    void controller.remove(currentUser, 'group-1');
    expect(service.findOne).toHaveBeenCalledWith(42, 7);
    expect(service.update).toHaveBeenCalledWith(42, 7, 'group-1', dto);
    expect(service.remove).toHaveBeenCalledWith(42, 'group-1');
  });
});
