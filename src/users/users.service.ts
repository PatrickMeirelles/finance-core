import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { MoreThan, Repository, IsNull } from 'typeorm';
import {
  hashPassword,
  comparePassword,
  tokenHash,
} from 'src/common/utils/hash.util';
import { UserToken } from './entities/user.tokens.entity';
import { LoginUserDto } from './dto/login-user-dto';
import { MailService } from 'src/mail/mail.service';
import { resetPasswordTemplate } from '../mail/templates/reset-password.template';
import { PasswordReset } from './entities/password-reset.entity';
import * as crypto from 'crypto';
import { createToken, verifyToken } from 'src/common/utils/jwt.util';
import { JwtService } from '@nestjs/jwt';
import { Account } from '../accounts/entities/account.entity';
import { Category } from 'src/categories/entities/category.entity';
import { defaultValues } from './common/default-initial-values';
import {
  INACTIVE_USER_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_REFRESH_TOKEN_MESSAGE,
  INVALID_TOKEN_MESSAGE,
  PASSWORD_RESET_NEUTRAL_MESSAGE,
  PASSWORD_RESET_TOKEN_BYTES,
  PASSWORD_RESET_TTL_MINUTES,
} from 'src/common/constants/security.constants';
import { ENV } from 'src/config/env.constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private userTokenRepository: Repository<UserToken>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private mailService: MailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async createDefaultData(userId: number) {
    const accounts = this.accountRepository.create(
      defaultValues.accounts.map((account) => ({
        ...account,
        user_id: userId,
      })),
    );

    const categories = this.categoryRepository.create(
      defaultValues.categories.map((category) => ({
        ...category,
        user_id: userId,
      })),
    );

    await Promise.all([
      this.accountRepository.save(accounts),
      this.categoryRepository.save(categories),
    ]);

    return { accounts, categories };
  }

  async create(dto: CreateUserDto) {
    const checkUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (checkUser) {
      throw new BadRequestException('Email already exists');
    }
    const hashedPassword = await hashPassword(dto.password);
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      full_name: dto.fullName,
      is_active: true,
    });

    const userCreated = await this.userRepository.save(user);
    const { accessToken, refreshToken } = await createToken(
      userCreated.id,
      userCreated.email,
      this.jwtService,
      this.userTokenRepository,
    );

    let hasToCreateDefaultData:
      { accounts: Account[]; categories: Category[] } | undefined;
    if (dto.initializeWithDefaultData) {
      hasToCreateDefaultData = await this.createDefaultData(userCreated.id);
    }
    return {
      id: userCreated.id,
      name: userCreated.name,
      email: userCreated.email,
      fullName: userCreated.full_name,
      createdAt: userCreated.created_at,
      accessToken: accessToken,
      refreshToken: refreshToken,
      defaultDataCreated: hasToCreateDefaultData,
    };
  }

  async login(dto: LoginUserDto) {
    // `password` is `select: false`, so it has to be asked for explicitly.
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const isMatch = await comparePassword(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.is_active) {
      throw new UnauthorizedException(INACTIVE_USER_MESSAGE);
    }

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
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  /**
   * Resolves the session behind an access token whose signature was already
   * verified. The row lookup is what makes logout and refresh rotation
   * effective before the token expires.
   */
  async getUserInformationByToken(token: string): Promise<User> {
    const userToken = await this.userTokenRepository.findOne({
      where: {
        access_token_hash: tokenHash(token),
        is_active: true,
        expires_at_access_token: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!userToken || !userToken.user.is_active) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
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
      ...(updateUserDto.name !== undefined && { name: updateUserDto.name }),
      ...(updateUserDto.fullName !== undefined && {
        full_name: updateUserDto.fullName,
      }),
    });
    return `User updated successfully`;
  }

  async refresh(refreshToken: string) {
    const payload = await verifyToken(this.jwtService, refreshToken, 'refresh');
    if (!payload) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const validToken = await this.userTokenRepository.findOne({
      where: {
        refresh_token_hash: tokenHash(refreshToken),
        is_active: true,
        expires_at_refresh_token: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!validToken || !validToken.user.is_active) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const { accessToken, refreshToken: newRefreshToken } = await createToken(
      validToken.user_id,
      validToken.user.email,
      this.jwtService,
      this.userTokenRepository,
    );

    return {
      accessToken: accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Always answers the same way so the endpoint cannot be used to discover
   * which e-mails are registered.
   */
  async forgotPassword(email: string) {
    const neutral = { message: PASSWORD_RESET_NEUTRAL_MESSAGE };

    const user = await this.userRepository.findOne({
      where: { email, is_active: true },
    });

    if (!user) {
      return neutral;
    }

    const token = crypto
      .randomBytes(PASSWORD_RESET_TOKEN_BYTES)
      .toString('hex');

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + PASSWORD_RESET_TTL_MINUTES);

    const reset = this.passwordResetRepository.create({
      user_id: user.id,
      token_hash: tokenHash(token),
      expires_at: expires,
    });

    await this.passwordResetRepository.save(reset);

    const resetBaseUrl = this.configService.get<string>(ENV.passwordResetUrl);
    const html = resetPasswordTemplate({
      token,
      resetLink: resetBaseUrl
        ? `${resetBaseUrl}?token=${encodeURIComponent(token)}`
        : undefined,
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    });

    try {
      await this.mailService.sendMail(user.email, 'Reset password', html);
    } catch (error) {
      // A mail outage must not reveal that the address exists.
      this.logger.error(
        `Could not send the password reset e-mail: ${(error as Error).message}`,
      );
    }

    return neutral;
  }

  async resetPassword(token: string, newPassword: string) {
    const validReset = await this.passwordResetRepository.findOne({
      where: {
        token_hash: tokenHash(token),
        expires_at: MoreThan(new Date()),
        used_at: IsNull(),
      },
    });

    if (!validReset) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepository.findOne({
      where: { id: validReset.user_id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await hashPassword(newPassword);

    await this.userRepository.save(user);

    // Every open session is closed when the password changes.
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
