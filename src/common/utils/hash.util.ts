import bcrypt from 'bcrypt';
import { addDays, addMinutes } from 'date-fns';

function generateTimeToken() {
  let tokens: {
    accessTokenTimeExpiration: Date;
    refreshTokenExpiration: Date;
  } = {
    accessTokenTimeExpiration: accessTokenExpirationTime(),
    refreshTokenExpiration: refreshTokenExpirationTime(),
  };
  if (
    process.env.NODE_ENV === 'local' ||
    process.env.NODE_ENV === 'development'
  ) {
    tokens = {
      accessTokenTimeExpiration: accessTokenExpirationTime(360), // 6 hours for development
      refreshTokenExpiration: tokens.refreshTokenExpiration,
    };
  }
  return tokens;
}

function accessTokenExpirationTime(minutes: number = 15) {
  return addMinutes(new Date(), minutes);
}

function refreshTokenExpirationTime(days: number = 7) {
  return addDays(new Date(), days);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function tokenHash(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareToken(
  token: string,
  hashedToken: string,
): Promise<boolean> {
  return bcrypt.compare(token, hashedToken);
}

export async function createTokens(userId: number, email: string) {
  const accessToken = await tokenHash(`${userId}-${email}-access`);
  const refreshToken = await tokenHash(`${userId}-${email}-refresh`);
  const timeTokens = generateTimeToken();
  return {
    accessToken,
    refreshToken,
    expiresAtAccessToken: timeTokens.accessTokenTimeExpiration,
    expiresAtRefreshToken: timeTokens.refreshTokenExpiration,
  };
}
