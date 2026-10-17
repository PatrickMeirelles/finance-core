import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { AccountBalanceService } from './accounts-balance.service';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private readonly accountBalanceService: AccountBalanceService,
  ) {}

  normalizeAccountData(dto: CreateAccountDto | UpdateAccountDto) {
    return {
      name: dto.name,
      type: dto.type,
      closing_day: dto.closing_day,
      due_day: dto.due_day,
      credit_limit: dto.credit_limit,
    };
  }

  async create(user: User, createAccountDto: CreateAccountDto) {
    const userId: number = user.id;
    const checkAccount = await this.accountRepository.findOne({
      where: {
        name: createAccountDto.name,
        user_id: userId,
        type: createAccountDto.type,
        is_active: true,
      },
    });
    if (checkAccount) {
      throw new BadRequestException(
        'Account name already exists to this type account for this user',
      );
    }
    const accountData = this.normalizeAccountData(createAccountDto);
    const account: Partial<Account> = this.accountRepository.create({
      ...accountData,
      user_id: userId,
    });
    return this.accountRepository.save(account);
  }

  async findAll(userId: number) {
    const accounts = await this.accountRepository.find({
      where: { user_id: userId, is_active: true },
    });

    const accountIds = accounts.map((a) => a.id);

    const balances =
      await this.accountBalanceService.getBalanceByAccountIds(accountIds);

    return accounts.map((account) => ({
      ...account,
      balance: balances.get(account.id) ?? 0,
    }));
  }

  async findOne(userId: number, id: number) {
    const account = await this.accountRepository.findOne({
      where: { id, user_id: userId, is_active: true },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const balance = await this.accountBalanceService.getBalanceByAccountId(
      account.id,
    );

    return {
      ...account,
      balance,
    };
  }

  /** Loads an account only if it belongs to `userId`; 400 otherwise. */
  private async getOwned(userId: number, id: number): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, user_id: userId, is_active: true },
    });
    if (!account) {
      throw new BadRequestException('Account not found');
    }
    return account;
  }

  async update(userId: number, id: number, updateAccountDto: UpdateAccountDto) {
    await this.getOwned(userId, id);
    const accountData = await this.accountRepository.update(
      { id, user_id: userId },
      this.normalizeAccountData(updateAccountDto),
    );
    if (accountData.affected === 0) {
      throw new BadRequestException('Account not found or no changes made');
    }
    return { message: 'Account updated successfully' };
  }

  async remove(userId: number, id: number) {
    await this.getOwned(userId, id);
    await this.accountRepository.update(
      { id, user_id: userId },
      { is_active: false },
    );
    return { message: 'Account removed successfully' };
  }
}
