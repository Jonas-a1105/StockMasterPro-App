import {
  Injectable,
  ExecutionContext,
  NestInterceptor,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { rlsStorage } from '../../prisma/rls.context';

@Injectable()
export class RLSInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();
    // req.user es inyectado por JwtAuthGuard
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return next.handle();
    }

    // Convertir el Observable de NestJS a una promesa para envolverlo en la transacción Prisma
    const promise = this.prisma.$transaction(async (tx) => {
      // Establecer el tenant_id actual en la conexión física antes de ejecutar cualquier consulta del request
      await tx.$executeRawUnsafe(
        `SELECT set_config('app.tenant_id', $1, true)`,
        tenantId,
      );

      return new Promise((resolve, reject) => {
        rlsStorage.run({ tenantId, tx }, () => {
          const observable = next.handle();
          (observable as any).subscribe({
            next: (res: any) => resolve(res),
            error: (err: any) => reject(err),
          });
        });
      });
    });

    return from(promise);
  }
}
