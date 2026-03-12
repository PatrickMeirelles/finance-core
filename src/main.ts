import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { GlobalResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new GlobalResponseInterceptor());
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
