/** Names of the environment variables read by the API. */
export const ENV = {
  nodeEnv: 'NODE_ENV',
  port: 'PORT',
  jwtSecret: 'JWT_SECRET',
  databaseUrl: 'DATABASE_URL',
  dbHost: 'DB_HOST',
  dbPort: 'DB_PORT',
  dbUser: 'DB_USER',
  dbPass: 'DB_PASS',
  dbName: 'DB_NAME',
  dbSsl: 'DB_SSL',
  corsOrigins: 'CORS_ORIGINS',
  smtpHost: 'SMTP_HOST',
  smtpPort: 'SMTP_PORT',
  smtpSecure: 'SMTP_SECURE',
  smtpUser: 'SMTP_USER',
  smtpPass: 'SMTP_PASS',
  mailFrom: 'MAIL_FROM',
  passwordResetUrl: 'PASSWORD_RESET_URL',
} as const;

export const PRODUCTION_ENV = 'production';

export const DEFAULT_PORT = 3000;
export const DEFAULT_DB_HOST = 'localhost';
export const DEFAULT_DB_PORT = 5432;
export const DEFAULT_SMTP_PORT = 587;
export const DEFAULT_MAIL_FROM = '"Xpen6" <no-reply@xpen6.app>';
export const SQLITE_DEV_DATABASE = 'database.sqlite';
export const TRUE_VALUES = ['true', '1', 'yes'];
