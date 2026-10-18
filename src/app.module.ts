import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { databaseConfig } from './config/database';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { MailModule } from './mail/mail.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import {
  THROTTLE_DEFAULT_LIMIT,
  THROTTLE_WINDOW_MS,
} from './common/constants/security.constants';
import { HEALTH_PATH } from './common/constants/http.constants';

/** Routes that work without a session. Everything else requires a Bearer token. */
export const PUBLIC_ROUTES = [
  { path: '', method: RequestMethod.GET },
  { path: HEALTH_PATH, method: RequestMethod.GET },
  { path: 'users/login', method: RequestMethod.POST },
  { path: 'users/register', method: RequestMethod.POST },
  { path: 'users/forgot-password', method: RequestMethod.POST },
  { path: 'users/reset-password', method: RequestMethod.POST },
  { path: 'users/refresh', method: RequestMethod.POST },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      { ttl: THROTTLE_WINDOW_MS, limit: THROTTLE_DEFAULT_LIMIT },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    UsersModule,
    MailModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(...PUBLIC_ROUTES)
      .forRoutes('*');
  }
}
