import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { MoreThan, Repository, IsNull } from 'typeorm';
import {
  hashPassword,
  comparePassword,
  compareToken,
} from 'src/common/utils/hash.util';
import { UserToken } from './entities/user.tokens.entity';
import { LoginUserDto } from './dto/login-user-dto';
import { MailService } from 'src/mail/mail.service';
import { resetPasswordTemplate } from '../mail/templates/reset-password.template';
import { PasswordReset } from './entities/password-reset.entity';
import * as crypto from 'crypto';
import { createToken } from 'src/common/utils/jwt.util';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private userTokenRepository: Repository<UserToken>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await hashPassword(dto.password);
    const checkUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (checkUser) {
      throw new BadRequestException('Email already exists');
    }
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      full_name: dto.fullName,
      is_active: dto.isActive,
    });

    const userCreated = await this.userRepository.save(user);
    const { accessToken, refreshToken } = await createToken(
      userCreated.id,
      userCreated.email,
      this.jwtService,
      this.userTokenRepository,
    );

    return {
      id: userCreated.id,
      name: userCreated.name,
      email: userCreated.email,
      fullName: userCreated.full_name,
      createdAt: userCreated.created_at,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async login(dto: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isMatch = await comparePassword(dto.password, user.password);

    if (!isMatch) {
      throw new BadRequestException('Invalid email or password');
    }

    console.log('User authenticated successfully');
    const { accessToken, refreshToken } = await createToken(
      user.id,
      user.email,
      this.jwtService,
      this.userTokenRepository,
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      fullName: user.full_name,
      createdAt: user.created_at,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async getUserInformationByToken(token: string) {
    const userToken = await this.userTokenRepository.findOne({
      where: {
        access_token: token,
        is_active: true,
        expires_at_access_token: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!userToken) {
      throw new BadRequestException('Invalid token');
    }

    return userToken.user;
  }

  async logout(userId: number) {
    await this.userTokenRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false },
    );
    return { message: 'Logged out successfully' };
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, {
      name: updateUserDto.name,
      full_name: updateUserDto.fullName,
    });
    return `User updated successfully`;
  }

  async refresh(refreshToken: string) {
    const tokens = await this.userTokenRepository.find({
      where: {
        is_active: true,
        expires_at_refresh_token: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    let validToken: UserToken | null = null;

    for (const token of tokens) {
      const isMatch = await compareToken(refreshToken, token.refresh_token);

      if (isMatch) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      throw new BadRequestException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = await createToken(
      validToken.user_id,
      validToken.user.email,
      this.jwtService,
      this.userTokenRepository,
    );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Email not found');
    }

    const token = crypto.randomBytes(32).toString('hex');

    const hashedToken = await hashPassword(token);

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    const reset = this.passwordResetRepository.create({
      user_id: user.id,
      token_hash: hashedToken,
      expires_at: expires,
    });

    await this.passwordResetRepository.save(reset);

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const html = resetPasswordTemplate(resetLink);

    await this.mailService.sendMail(user.email, 'Reset password', html);

    return {
      message: 'Password reset email sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resets = await this.passwordResetRepository.find({
      where: {
        expires_at: MoreThan(new Date()),
        used_at: IsNull(),
      },
    });

    let validReset: PasswordReset | null = null;

    for (const reset of resets) {
      const isMatch = await compareToken(token, reset.token_hash);

      if (isMatch) {
        validReset = reset;
        break;
      }
    }

    if (!validReset) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepository.findOne({
      where: { id: validReset.user_id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;

    await this.userRepository.save(user);

    await this.userTokenRepository.update(
      { user_id: user.id },
      { is_active: false },
    );

    validReset.used_at = new Date();

    await this.passwordResetRepository.save(validReset);

    return {
      message: 'Password updated successfully',
    };
  }
}
