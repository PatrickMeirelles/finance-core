import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { corsOrigins } from './app.setup';
import { PaginationDto } from './common/dto/pagination.dto';
import { GetTransactionsDto } from './transactions/dto/get-transactions.dto';
import { CreateUserDto } from './users/dto/create-user.dto';
import { PAGINATION_MAX_LIMIT } from './common/constants/security.constants';

const pipe = new ValidationPipe({ transform: true, whitelist: true });
const validate = <T>(metatype: new () => T, value: unknown) =>
  pipe.transform(value, { type: 'body', metatype }) as Promise<T>;

describe('corsOrigins', () => {
  it('allows any origin when unset or *', () => {
    expect(corsOrigins(new ConfigService({}))).toBe('*');
    expect(corsOrigins(new ConfigService({ CORS_ORIGINS: ' * ' }))).toBe('*');
  });

  it('splits a comma separated allow list', () => {
    expect(
      corsOrigins(
        new ConfigService({ CORS_ORIGINS: 'https://a.app, https://b.app' }),
      ),
    ).toEqual(['https://a.app', 'https://b.app']);
  });
});

describe('request validation', () => {
  it('drops properties that are not part of the DTO', async () => {
    const dto = await validate(CreateUserDto, {
      name: 'Robson',
      email: 'robson@example.com',
      password: 'Str0ng!Pass',
      fullName: 'Robson Dias',
      isActive: false,
      role: 'admin',
    });
    expect(dto).not.toHaveProperty('isActive');
    expect(dto).not.toHaveProperty('role');
  });

  it('caps the page size', async () => {
    await expect(
      validate(PaginationDto, { limit: PAGINATION_MAX_LIMIT + 1 }),
    ).rejects.toThrow();
    const dto = await validate(PaginationDto, { limit: PAGINATION_MAX_LIMIT });
    expect(dto.limit).toBe(PAGINATION_MAX_LIMIT);
  });

  it('only accepts known sort orders, types and statuses', async () => {
    await expect(
      validate(GetTransactionsDto, { order: 'random' }),
    ).rejects.toThrow();
    await expect(validate(GetTransactionsDto, { type: 'x' })).rejects.toThrow();
    const dto = await validate(GetTransactionsDto, {
      order: 'asc',
      accountIds: '3',
    });
    expect(dto.order).toBe('ASC');
    expect(dto.accountIds).toEqual([3]);
  });
});
