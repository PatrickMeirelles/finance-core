import { UserToken } from 'src/users/entities/user.tokens.entity';
import { Repository } from 'typeorm';
import { hashPassword } from './hash.util';
import { addMinutes, addDays } from 'date-fns';
import { JwtService } from '@nestjs/jwt';

type JwtTimeTokens = {
  accessTokenTimeExpiration: number;
  refreshTokenExpiration: number;
};

function generateTimeStringJwtToken(): JwtTimeTokens {
  let tokens: JwtTimeTokens = {
    accessTokenTimeExpiration: accessTokenExpirationTime(),
    refreshTokenExpiration: refreshTokenExpirationTime(),
  };

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'beta'
  ) {
    return (tokens = {
      accessTokenTimeExpiration: accessTokenExpirationTime(360),
      refreshTokenExpiration: tokens.refreshTokenExpiration,
    });
  }

  return tokens;
}

function accessTokenExpirationTime(minutes: number = 15): number {
  return minutes;
}

function refreshTokenExpirationTime(days: number = 7): number {
  return days;
}

export async function createToken(
  userId: number,
  email: string,
  jwtService: JwtService,
  userTokenRepository: Repository<UserToken>,
) {
  const payload = { sub: userId, email };
  const timeTokensString = generateTimeStringJwtToken();

  const accessToken = await jwtService.signAsync(payload, {
    expiresIn: `${timeTokensString.accessTokenTimeExpiration}m`,
  });

  const refreshToken = await jwtService.signAsync(payload, {
    expiresIn: `${timeTokensString.refreshTokenExpiration}d`,
  });

  const hashedRefreshToken = await hashPassword(refreshToken);

  await userTokenRepository.update(
    { user_id: userId, is_active: true },
    { is_active: false },
  );

  const expiresAtAccessToken = addMinutes(
    new Date(),
    timeTokensString.accessTokenTimeExpiration,
  );
  const expiresAtRefreshToken = addDays(
    new Date(),
    timeTokensString.refreshTokenExpiration,
  );

  const userToken = userTokenRepository.create({
    user_id: userId,
    access_token: accessToken,
    expires_at_access_token: expiresAtAccessToken,
    refresh_token: hashedRefreshToken,
    expires_at_refresh_token: expiresAtRefreshToken,
    is_active: true,
  });

  await userTokenRepository.save(userToken);

  return { accessToken, refreshToken };
}
