import {
  Controller,
  Post,
  Body,
  Patch,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/response-user-dto';
import { LoginUserDto } from './dto/login-user-dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from 'src/common/decorators/current.user.decorator';
import { User } from './entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  THROTTLE_AUTH_LIMIT,
  THROTTLE_WINDOW_MS,
} from 'src/common/constants/security.constants';

/** Credential endpoints get a much smaller request budget per IP. */
const authThrottle = {
  default: { limit: THROTTLE_AUTH_LIMIT, ttl: THROTTLE_WINDOW_MS },
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Throttle(authThrottle)
  @Post('register')
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Throttle(authThrottle)
  @Post('login')
  login(@Body() loginDto: LoginUserDto) {
    return this.usersService.login(loginDto);
  }

  @Throttle(authThrottle)
  @Post('refresh')
  refresh(@Body() refreshDto: RefreshTokenDto) {
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

  @Throttle(authThrottle)
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle(authThrottle)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(dto.token, dto.password);
  }
}
