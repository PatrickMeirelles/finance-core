import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isTest = configService.get('NODE_ENV') === 'development';
  const isBeta = configService.get('NODE_ENV') === 'beta';

  if (isTest) {
    return {
      type: 'better-sqlite3',
      database: 'database.sqlite',
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    };
  }

  if (isBeta) {
    return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT') ?? 5432,
      username: configService.get<string>('DB_USER'),
      password: configService.get<string>('DB_PASS'),
      database: configService.get<string>('DB_NAME'),
      synchronize: true,
      autoLoadEntities: true,
    };
  }

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT') ?? 3306,
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
    synchronize: true,
    autoLoadEntities: true,
  };
};
