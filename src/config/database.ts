import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isTest = configService.get('NODE_ENV') === 'development';

  if (isTest) {
    return {
      type: 'better-sqlite3',
      database: 'database.sqlite',
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    };
  }

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
    synchronize: true,
    autoLoadEntities: true,
  };
};
