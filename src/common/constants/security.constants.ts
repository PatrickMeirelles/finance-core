import { IsStrongPasswordOptions } from 'class-validator';

/** Password policy shared by register and reset-password. */
export const PASSWORD_POLICY: IsStrongPasswordOptions = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols.';

export const BCRYPT_SALT_ROUNDS = 10;

/** Access token lifetime (minutes). */
export const ACCESS_TOKEN_TTL_MINUTES = 15;

/** Longer access tokens only for local development, never in production. */
export const DEV_ACCESS_TOKEN_TTL_MINUTES = 360;

/** Refresh token lifetime (days). */
export const REFRESH_TOKEN_TTL_DAYS = 7;

export const PASSWORD_RESET_TTL_MINUTES = 15;

export const PASSWORD_RESET_TOKEN_BYTES = 32;

/** Fallback JWT secret, accepted only when NODE_ENV=development. */
export const DEVELOPMENT_JWT_SECRET = 'development-only-secret-do-not-use';

export const BEARER_PREFIX = 'Bearer';

/** Same message for an existing or unknown e-mail (no user enumeration). */
export const PASSWORD_RESET_NEUTRAL_MESSAGE =
  'If the e-mail is registered, a password reset message was sent';

export const INVALID_TOKEN_MESSAGE = 'Invalid token';
export const INVALID_REFRESH_TOKEN_MESSAGE = 'Invalid refresh token';
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
export const INACTIVE_USER_MESSAGE = 'User is inactive';

/** Global throttling: requests per IP inside the window. */
export const THROTTLE_WINDOW_MS = 60_000;
export const THROTTLE_DEFAULT_LIMIT = 120;

/** Stricter budget for credential endpoints (login, register, reset). */
export const THROTTLE_AUTH_LIMIT = 10;

export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const PAGINATION_MAX_LIMIT = 100;

/** Allowed CORS origins when CORS_ORIGINS is not configured. */
export const CORS_ALLOW_ANY_ORIGIN = '*';
export const CORS_ORIGINS_SEPARATOR = ',';
