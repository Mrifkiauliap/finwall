import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  message: string;
  error: null | string;
  data?: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        let message = 'Success';
        let data: any = null;
        let meta: any = undefined;

        // Custom object format handling
        if (res && typeof res === 'object' && !Array.isArray(res)) {
          message = res.message || message;
          data = res.data !== undefined ? res.data : res;
          meta = res.meta;
        } else {
          data = res ?? null;
        }

        return {
          message,
          error: null,
          ...(data !== null && data !== undefined && { data }),
          ...(meta !== undefined && { meta }),
        };
      }),
    );
  }
}
