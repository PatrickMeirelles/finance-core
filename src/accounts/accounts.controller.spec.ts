import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { User } from 'src/users/entities/user.entity';
import { PaymentMethod } from './entities/enum/payment-method.enum';

describe('AccountsController', () => {
  const currentUser = { id: 42 } as User;
  let controller: AccountsController;
  let service: jest.Mocked<
    Pick<AccountsService, 'findOne' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    service = {
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [{ provide: AccountsService, useValue: service }],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('scopes read, update and delete to the authenticated user', () => {
    const dto = { name: 'Nubank', type: PaymentMethod.CREDIT_CARD };
    void controller.findOne(currentUser, 10);
    void controller.update(currentUser, 10, dto);
    void controller.remove(currentUser, 10);
    expect(service.findOne).toHaveBeenCalledWith(42, 10);
    expect(service.update).toHaveBeenCalledWith(42, 10, dto);
    expect(service.remove).toHaveBeenCalledWith(42, 10);
  });
});
