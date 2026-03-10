import {
  Controller,
  Post,
  Body,
  Patch,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/response-user-dto';
import { LoginUserDto } from './dto/login-user-dto';
import { CurrentUser } from 'src/common/decorators/current.user.decorator';
import { User } from './entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() refreshDto: { refreshToken: string }) {
    return this.usersService.refresh(refreshDto.refreshToken);
  }

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return user;
  }

  @Patch('update')
  update(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Post('logout')
  logout(@CurrentUser() user: User) {
    return this.usersService.logout(user.id);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(dto.token, dto.password);
  }
}
