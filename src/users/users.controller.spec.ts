import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  const currentUser = { id: 42, email: 'a@b.c' } as User;
  let controller: UsersController;
  let service: jest.Mocked<
    Pick<UsersService, 'create' | 'refresh' | 'update' | 'logout'>
  >;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      refresh: jest.fn(),
      update: jest.fn(),
      logout: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('delegates registration to the service', () => {
    const dto = {
      name: 'John',
      email: 'john@example.com',
      password: 'Str0ng!Pass',
      fullName: 'John Doe',
    };
    void controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('returns the session user from /me and rejects anonymous calls', () => {
    expect(controller.getProfile(currentUser)).toBe(currentUser);
    expect(() => controller.getProfile(undefined as unknown as User)).toThrow(
      UnauthorizedException,
    );
  });

  it('uses the session user id for update and logout', () => {
    void controller.update(currentUser, { name: 'Jo' });
    void controller.logout(currentUser);
    expect(service.update).toHaveBeenCalledWith(42, { name: 'Jo' });
    expect(service.logout).toHaveBeenCalledWith(42);
  });

  it('passes the refresh token through the validated body', () => {
    void controller.refresh({ refreshToken: 'r' });
    expect(service.refresh).toHaveBeenCalledWith('r');
  });
});
