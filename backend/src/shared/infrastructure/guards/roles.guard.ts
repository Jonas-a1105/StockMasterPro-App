import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    // Si el rol del usuario está directamente permitido, autorizar.
    if (requiredRoles.includes(user.role)) return true;

    // Si la acción requiere privilegios 'admin' generales (de super admin) y el usuario no lo es, denegar.
    const requiresSuperAdminOnly = requiredRoles.length === 1 && requiredRoles[0] === 'admin';
    if (requiresSuperAdminOnly) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    // Permitir a usuarios locales de negocios (como 'user', 'gerente') gestionar sus recursos propios si no es un rol de super-administración del sistema.
    if (user.role === 'user') {
      return true;
    }

    throw new ForbiddenException(
      'No tienes permisos para realizar esta acción',
    );
  }
}
