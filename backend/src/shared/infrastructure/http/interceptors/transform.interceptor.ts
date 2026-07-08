import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((data: any) => {
        if (data?.data !== undefined && data?.meta !== undefined) {
          return data;
        }
        if (data?.data !== undefined && data?.total !== undefined) {
          return { data: data.data, meta: { total: data.total, limit: data.limit, offset: data.offset } };
        }
        return { data };
      }),
    );
  }
}
