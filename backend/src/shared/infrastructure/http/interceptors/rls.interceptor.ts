import {
  Injectable,
  ExecutionContext,
  NestInterceptor,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { rlsStorage } from '../../prisma/rls.context';

@Injectable()
export class RLSInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    // req.user es inyectado por JwtAuthGuard
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      rlsStorage.run({ tenantId }, () => {
        (next.handle() as any).subscribe({
          next: (val: any) => subscriber.next(val),
          error: (err: any) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
