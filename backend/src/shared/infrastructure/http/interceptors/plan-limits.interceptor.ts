import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { LicensesService } from '../../../../modules/licenses/infrastructure/licenses.service';

@Injectable()
export class PlanLimitsInterceptor implements NestInterceptor {
  constructor(private readonly licensesService: LicensesService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, path, user } = request;

    // Solo interceptar peticiones POST (creación de recursos)
    if (method === 'POST' && user?.tenantId) {
      // Normalizar ruta removiendo barra inclinada final
      const cleanPath = path.replace(/\/$/, '');
      let resourceKey: string | null = null;

      if (cleanPath === '/inventory') {
        resourceKey = 'products';
      } else if (cleanPath === '/users') {
        resourceKey = 'users';
      } else if (cleanPath === '/warehouses') {
        resourceKey = 'warehouses';
      } else if (cleanPath === '/customers') {
        resourceKey = 'customers';
      } else if (cleanPath === '/suppliers') {
        resourceKey = 'suppliers';
      } else if (cleanPath === '/accounts-payable') {
        resourceKey = 'accountsPayable';
      } else if (cleanPath === '/expenses') {
        resourceKey = 'expenses';
      }

      if (resourceKey) {
        try {
          const stats = await this.licensesService.getUsageStats(user.tenantId);
          const resourceStats = (stats as any)[resourceKey];

          if (resourceStats && resourceStats.limit !== null) {
            if (resourceStats.current >= resourceStats.limit) {
              throw new HttpException(
                `Límite de plan excedido: Tu suscripción actual permite un máximo de ${resourceStats.limit} ${resourceKey}.`,
                HttpStatus.FORBIDDEN,
              );
            }
          }
        } catch (err: any) {
          if (err instanceof HttpException) {
            throw err;
          }
          // Si es otro tipo de error, dejar continuar pero registrarlo
          console.error(`Error checking plan limits for ${resourceKey}:`, err);
        }
      }
    }

    return next.handle();
  }
}
