import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CurrentUser } from 'src/common/decorators/current.user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('create')
  async create(
    @CurrentUser() currentUser: User,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return await this.accountsService.create(currentUser, createAccountDto);
  }

  @Get()
  findAll(@CurrentUser() currentUser: User) {
    return this.accountsService.findAll(currentUser.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountsService.findOne(currentUser.id, id);
  }

  @Patch('update/:id')
  update(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(currentUser.id, id, updateAccountDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountsService.remove(currentUser.id, id);
  }
}
