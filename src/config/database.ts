import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isDev = configService.get('NODE_ENV') === 'development';

  if (isDev) {
    return {
      type: 'better-sqlite3',
      database: 'database.sqlite',
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    };
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: Number(configService.get<number>('DB_PORT')) || 5432,
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
    synchronize: true,
    autoLoadEntities: true,
  };
};
