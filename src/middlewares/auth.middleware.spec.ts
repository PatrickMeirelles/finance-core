import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { AuthMiddleware } from './auth.middleware';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

describe('AuthMiddleware', () => {
  const jwt = new JwtService({ secret: 'test-secret' });
  const otherJwt = new JwtService({ secret: 'another-secret' });
  const user = { id: 7, email: 'a@b.c' } as User;
  let usersService: { getUserInformationByToken: jest.Mock };
  let middleware: AuthMiddleware;

  beforeEach(() => {
    usersService = { getUserInformationByToken: jest.fn() };
    middleware = new AuthMiddleware(
      usersService as unknown as UsersService,
      jwt,
    );
  });

  const run = (authorization?: string) => {
    const req = { headers: { authorization } } as Request;
    const next = jest.fn();
    return middleware
      .use(req, {} as Response, next)
      .then(() => ({ req, next }));
  };

  it('parses only well-formed Bearer headers', () => {
    expect(AuthMiddleware.bearerToken('Bearer abc')).toBe('abc');
    expect(AuthMiddleware.bearerToken('Basic abc')).toBeNull();
    expect(AuthMiddleware.bearerToken('Bearer')).toBeNull();
    expect(AuthMiddleware.bearerToken(undefined)).toBeNull();
  });

  it('rejects requests without a token', async () => {
    await expect(run(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.getUserInformationByToken).not.toHaveBeenCalled();
  });

  it('rejects tokens signed with another secret before touching the database', async () => {
    const forged = await otherJwt.signAsync({ sub: 7, kind: 'access' });
    await expect(run(`Bearer ${forged}`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.getUserInformationByToken).not.toHaveBeenCalled();
  });

  it('rejects a refresh token used as an access token', async () => {
    const refresh = await jwt.signAsync({ sub: 7, kind: 'refresh' });
    await expect(run(`Bearer ${refresh}`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the session user for a valid access token', async () => {
    usersService.getUserInformationByToken.mockResolvedValue(user);
    const access = await jwt.signAsync({ sub: 7, kind: 'access' });
    const { req, next } = await run(`Bearer ${access}`);
    expect(usersService.getUserInformationByToken).toHaveBeenCalledWith(access);
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalled();
  });
});
