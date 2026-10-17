import { UserToken } from 'src/users/entities/user.tokens.entity';
import { Repository } from 'typeorm';
import { tokenHash } from './hash.util';
import { addMinutes, addDays } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { DEVELOPMENT_ENV } from '../constants/environment.constants';
import {
  ACCESS_TOKEN_TTL_MINUTES,
  DEV_ACCESS_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_TTL_DAYS,
} from '../constants/security.constants';

export type TokenKind = 'access' | 'refresh';

export interface TokenPayload {
  sub: number;
  email: string;
  kind: TokenKind;
  jti: string;
}

function accessTokenTtlMinutes(): number {
  return process.env.NODE_ENV === DEVELOPMENT_ENV
    ? DEV_ACCESS_TOKEN_TTL_MINUTES
    : ACCESS_TOKEN_TTL_MINUTES;
}

export async function createToken(
  userId: number,
  email: string,
  jwtService: JwtService,
  userTokenRepository: Repository<UserToken>,
) {
  const accessMinutes = accessTokenTtlMinutes();

  // `jti` makes every token unique even when two are issued within the same
  // second (otherwise the digests stored for the session would collide).
  const accessPayload: TokenPayload = {
    sub: userId,
    email,
    kind: 'access',
    jti: randomUUID(),
  };
  const refreshPayload: TokenPayload = {
    sub: userId,
    email,
    kind: 'refresh',
    jti: randomUUID(),
  };

  const accessToken = await jwtService.signAsync(accessPayload, {
    expiresIn: `${accessMinutes}m`,
  });

  const refreshToken = await jwtService.signAsync(refreshPayload, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });

  await userTokenRepository.update(
    { user_id: userId, is_active: true },
    { is_active: false },
  );

  const userToken = userTokenRepository.create({
    user_id: userId,
    access_token_hash: tokenHash(accessToken),
    expires_at_access_token: addMinutes(new Date(), accessMinutes),
    refresh_token_hash: tokenHash(refreshToken),
    expires_at_refresh_token: addDays(new Date(), REFRESH_TOKEN_TTL_DAYS),
    is_active: true,
  });

  await userTokenRepository.save(userToken);

  return { accessToken, refreshToken };
}

/**
 * Verifies the signature and expiry of a token and checks it was issued for
 * the expected purpose. Returns null for anything that does not check out.
 */
export async function verifyToken(
  jwtService: JwtService,
  token: string,
  kind: TokenKind,
): Promise<TokenPayload | null> {
  try {
    const payload = await jwtService.verifyAsync<TokenPayload>(token);
    return payload.kind === kind ? payload : null;
  } catch {
    return null;
  }
}
