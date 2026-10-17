import { ConfigService } from '@nestjs/config';
import { DEVELOPMENT_ENV } from '../common/constants/environment.constants';
import { DEVELOPMENT_JWT_SECRET } from '../common/constants/security.constants';
import { ENV, TRUE_VALUES } from './env.constants';

export function isDevelopment(config: ConfigService): boolean {
  return config.get<string>(ENV.nodeEnv) === DEVELOPMENT_ENV;
}

export function envFlag(config: ConfigService, key: string): boolean {
  const raw = config.get<string>(key);
  return raw !== undefined && TRUE_VALUES.includes(raw.toLowerCase());
}

/**
 * The JWT secret must come from the environment. Only local development may
 * fall back to a fixed value; anywhere else the API refuses to start.
 */
export function jwtSecretFrom(config: ConfigService): string {
  const secret = config.get<string>(ENV.jwtSecret);
  if (secret && secret.length > 0) {
    return secret;
  }
  if (isDevelopment(config)) {
    return DEVELOPMENT_JWT_SECRET;
  }
  throw new Error(`${ENV.jwtSecret} must be set outside development`);
}
