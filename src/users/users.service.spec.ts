import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserToken } from './entities/user.tokens.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { MailService } from 'src/mail/mail.service';
import { Account } from 'src/accounts/entities/account.entity';
import { Category } from 'src/categories/entities/category.entity';
import { hashPassword, tokenHash } from 'src/common/utils/hash.util';
import { PASSWORD_RESET_NEUTRAL_MESSAGE } from 'src/common/constants/security.constants';

describe('UsersService', () => {
  const jwt = new JwtService({ secret: 'test-secret' });
  let users: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
  };
  let tokens: {
    findOne: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let resets: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let mail: { sendMail: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    users = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
    };
    tokens = {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn((row: Partial<UserToken>) => row),
      save: jest.fn((row: UserToken) => Promise.resolve(row)),
    };
    resets = {
      findOne: jest.fn(),
      create: jest.fn((row: Partial<PasswordReset>) => row),
      save: jest.fn((row: PasswordReset) => Promise.resolve(row)),
    };
    mail = { sendMail: jest.fn() };
    service = new UsersService(
      users as unknown as Repository<User>,
      tokens as unknown as Repository<UserToken>,
      resets as unknown as Repository<PasswordReset>,
      {} as Repository<Account>,
      {} as Repository<Category>,
      mail as unknown as MailService,
      jwt,
      new ConfigService({}),
    );
  });

  describe('login', () => {
    const queryBuilderFor = (user: Partial<User> | null) => {
      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      users.createQueryBuilder.mockReturnValue(qb);
      return qb;
    };

    it('selects the password hash explicitly and issues hashed session rows', async () => {
      const qb = queryBuilderFor({
        id: 1,
        email: 'a@b.c',
        is_active: true,
        password: await hashPassword('Str0ng!Pass'),
      });
      const result = await service.login({
        email: 'a@b.c',
        password: 'Str0ng!Pass',
      });
      expect(qb.addSelect).toHaveBeenCalledWith('user.password');
      expect(result.accessToken).toBeDefined();
      const [[stored]] = tokens.save.mock.calls as [[UserToken]];
      expect(stored.access_token_hash).toBe(tokenHash(result.accessToken));
      expect(stored.refresh_token_hash).toBe(tokenHash(result.refreshToken));
      expect(stored).not.toHaveProperty('access_token');
    });

    it('uses the same error for unknown e-mail and wrong password', async () => {
      queryBuilderFor(null);
      await expect(
        service.login({ email: 'x@y.z', password: 'Str0ng!Pass' }),
      ).rejects.toThrow(UnauthorizedException);
      queryBuilderFor({
        id: 1,
        is_active: true,
        password: await hashPassword('other'),
      });
      await expect(
        service.login({ email: 'a@b.c', password: 'Str0ng!Pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('answers neutrally and sends nothing for an unknown e-mail', async () => {
      users.findOne.mockResolvedValue(null);
      await expect(service.forgotPassword('nobody@x.y')).resolves.toEqual({
        message: PASSWORD_RESET_NEUTRAL_MESSAGE,
      });
      expect(mail.sendMail).not.toHaveBeenCalled();
      expect(resets.save).not.toHaveBeenCalled();
    });

    it('stores only a digest of the token and mails the code', async () => {
      users.findOne.mockResolvedValue({
        id: 1,
        email: 'a@b.c',
        is_active: true,
      });
      await expect(service.forgotPassword('a@b.c')).resolves.toEqual({
        message: PASSWORD_RESET_NEUTRAL_MESSAGE,
      });
      const [[saved]] = resets.save.mock.calls as [[PasswordReset]];
      const [[, , html]] = mail.sendMail.mock.calls as [
        [string, string, string],
      ];
      const token = /<pre[^>]*>([a-f0-9]+)<\/pre>/.exec(html)?.[1];
      expect(token).toHaveLength(64);
      expect(saved.token_hash).toBe(tokenHash(token!));
      expect(html).not.toContain('localhost');
    });
  });

  describe('refresh', () => {
    it('rejects tokens that are not refresh tokens or are not stored', async () => {
      const access = await jwt.signAsync({
        sub: 1,
        email: 'a@b.c',
        kind: 'access',
      });
      await expect(service.refresh(access)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh('garbage')).rejects.toThrow(
        UnauthorizedException,
      );
      tokens.findOne.mockResolvedValue(null);
      const refresh = await jwt.signAsync({
        sub: 1,
        email: 'a@b.c',
        kind: 'refresh',
      });
      await expect(service.refresh(refresh)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(tokens.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            refresh_token_hash: tokenHash(refresh),
          }),
        }),
      );
    });

    it('rotates the session for a valid refresh token', async () => {
      const refresh = await jwt.signAsync({
        sub: 1,
        email: 'a@b.c',
        kind: 'refresh',
      });
      tokens.findOne.mockResolvedValue({
        user_id: 1,
        user: { id: 1, email: 'a@b.c', is_active: true },
      });
      const result = await service.refresh(refresh);
      expect(result.refreshToken).not.toBe(refresh);
      expect(tokens.update).toHaveBeenCalledWith(
        { user_id: 1, is_active: true },
        { is_active: false },
      );
    });
  });
});
