import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';
import { AccountBalanceService } from './accounts-balance.service';
import { PaymentMethod } from './entities/enum/payment-method.enum';

describe('AccountsService ownership', () => {
  const owner = 1;
  const intruder = 2;
  const account = { id: 10, user_id: owner, is_active: true } as Account;
  let repository: jest.Mocked<Pick<Repository<Account>, 'findOne' | 'update'>>;
  let service: AccountsService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(({ where }: { where: Partial<Account> }) =>
        Promise.resolve(
          where.id === account.id && where.user_id === owner ? account : null,
        ),
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    service = new AccountsService(
      repository as unknown as Repository<Account>,
      {} as AccountBalanceService,
    );
  });

  const dto = { name: 'Nubank', type: PaymentMethod.CREDIT_CARD };

  it('updates an account that belongs to the caller', async () => {
    await expect(service.update(owner, account.id, dto)).resolves.toEqual({
      message: 'Account updated successfully',
    });
    expect(repository.update).toHaveBeenCalledWith(
      { id: account.id, user_id: owner },
      expect.objectContaining({ name: 'Nubank' }),
    );
  });

  it('refuses to update an account of another user', async () => {
    await expect(service.update(intruder, account.id, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('refuses to remove an account of another user', async () => {
    await expect(service.remove(intruder, account.id)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('soft-deletes only within the caller scope', async () => {
    await service.remove(owner, account.id);
    expect(repository.update).toHaveBeenCalledWith(
      { id: account.id, user_id: owner },
      { is_active: false },
    );
  });
});
