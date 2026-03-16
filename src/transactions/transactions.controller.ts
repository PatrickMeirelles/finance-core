import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrentUser } from 'src/common/decorators/current.user.decorator';
import { User } from 'src/users/entities/user.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('create')
  create(
    @CurrentUser() currentUser: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(
      currentUser.id,
      createTransactionDto,
    );
  }

  @Get()
  findAll(
    @CurrentUser() currentUser: User,
    @Query() filters: GetTransactionsDto,
  ) {
    return this.transactionsService.getTransactions(currentUser, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() currentUser: User, @Param('id') id: string) {
    return this.transactionsService.findOne(currentUser.id, +id);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: User,
    @Param('id') id: string,
    @Param('installmentGroupId') installmentGroupId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(
      currentUser.id,
      +id,
      installmentGroupId,
      updateTransactionDto,
    );
  }

  @Delete(':installmentsGroupId')
  remove(@Param('installmentsGroupId') installmentsGroupId: string) {
    return this.transactionsService.remove(installmentsGroupId);
  }
}
