import { ConfigService } from '@nestjs/config';
import { jwtSecretFrom, envFlag } from './env.util';
import { DEVELOPMENT_JWT_SECRET } from '../common/constants/security.constants';

describe('env.util', () => {
  it('uses the configured JWT secret when present', () => {
    expect(jwtSecretFrom(new ConfigService({ JWT_SECRET: 'abc' }))).toBe('abc');
  });

  it('falls back to a fixed secret only in development', () => {
    expect(jwtSecretFrom(new ConfigService({ NODE_ENV: 'development' }))).toBe(
      DEVELOPMENT_JWT_SECRET,
    );
  });

  it('refuses to start without a secret outside development', () => {
    expect(() =>
      jwtSecretFrom(new ConfigService({ NODE_ENV: 'production' })),
    ).toThrow(/JWT_SECRET/);
    expect(() => jwtSecretFrom(new ConfigService({}))).toThrow(/JWT_SECRET/);
  });

  it('parses boolean flags', () => {
    expect(envFlag(new ConfigService({ DB_SSL: 'true' }), 'DB_SSL')).toBe(true);
    expect(envFlag(new ConfigService({ DB_SSL: '0' }), 'DB_SSL')).toBe(false);
    expect(envFlag(new ConfigService({}), 'DB_SSL')).toBe(false);
  });
});
