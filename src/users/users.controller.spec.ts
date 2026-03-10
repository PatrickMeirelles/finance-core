import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should create a user', () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      fullName: 'Johnathan Doe',
      isActive: true,
    };

    const result = controller.create(createUserDto);
    expect(result).toBe('This action adds a new user');
  });
});
