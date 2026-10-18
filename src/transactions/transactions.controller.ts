import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrentUser } from 'src/common/decorators/current.user.decorator';
import { User } from 'src/users/entities/user.entity';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { GetInsightsDto } from './dto/get-insights.dto';
import {
  IMPORT_FILE_FIELD,
  IMPORT_MAX_FILE_SIZE_BYTES,
} from './constants/import.constants';

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

  @Post('import')
  @UseInterceptors(
    FileInterceptor(IMPORT_FILE_FIELD, {
      limits: { fileSize: IMPORT_MAX_FILE_SIZE_BYTES },
    }),
  )
  importStatement(
    @CurrentUser() currentUser: User,
    @Body() dto: ImportTransactionsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.transactionsService.importStatement(currentUser.id, dto, file);
  }

  /** Declared before `:id` so the literal path is not captured as an id. */
  @Get('insights')
  insights(@CurrentUser() currentUser: User, @Query() dto: GetInsightsDto) {
    return this.transactionsService.getInsights(currentUser.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionsService.findOne(currentUser.id, id);
  }

  /** Pass `?installmentGroupId=<uuid>` to update every installment at once. */
  @Patch(':id')
  update(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Query('installmentGroupId') installmentGroupId: string | undefined,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(
      currentUser.id,
      id,
      installmentGroupId,
      updateTransactionDto,
    );
  }

  @Delete(':installmentsGroupId')
  remove(
    @CurrentUser() currentUser: User,
    @Param('installmentsGroupId') installmentsGroupId: string,
  ) {
    return this.transactionsService.remove(currentUser.id, installmentsGroupId);
  }
}
