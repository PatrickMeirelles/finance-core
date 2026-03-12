import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  normalizeAccountData(dto: CreateAccountDto | UpdateAccountDto) {
    return {
      name: dto.name,
      type: dto.type,
      balance: dto.balance ? dto.balance : 0,
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
    return await this.accountRepository.find({
      where: { user_id: userId },
    });
  }

  async findOne(id: number) {
    const getAccount = await this.accountRepository.findOne({ where: { id } });
    if (!getAccount) {
      throw new BadRequestException('Account not found');
    }
    return getAccount;
  }

  async update(id: number, updateAccountDto: UpdateAccountDto) {
    const getAccount = await this.accountRepository.findOne({ where: { id } });
    if (!getAccount) {
      throw new BadRequestException('Account not found');
    }
    const accountData = await this.accountRepository.update(
      id,
      this.normalizeAccountData(updateAccountDto),
    );
    if (accountData.affected === 0) {
      throw new BadRequestException('Account not found or no changes made');
    }
    await this.accountRepository.findOne({ where: { id } });
    return { message: 'Account updated successfully' };
  }

  async remove(id: number) {
    const getAccount = await this.accountRepository.findOne({ where: { id } });
    if (!getAccount) {
      throw new BadRequestException('Account not found');
    }
    await this.accountRepository.update(id, { is_active: false });
    return { message: 'Account removed successfully' };
  }
}
