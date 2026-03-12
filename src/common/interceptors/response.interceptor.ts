import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T | { data?: T; message?: string }) => ({
        success: true,
        message:
          typeof data === 'object' && data !== null && 'message' in data
            ? (data.message ?? 'request successful')
            : 'request successful',
        data:
          typeof data === 'object' && data !== null && 'data' in data
            ? (data.data as T)
            : (data as T),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
