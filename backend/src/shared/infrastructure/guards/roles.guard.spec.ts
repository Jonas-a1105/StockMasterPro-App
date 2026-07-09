import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockContext = (userRole: string) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole } }),
        getResponse: () => ({}),
      }),
    }) as any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('should allow access to public routes regardless of role', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(guard.canActivate(mockContext('cajero'))).toBe(true);
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('cajero'))).toBe(true);
  });

  it('should allow access when user role is in required roles', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['gerente', 'admin']);
    expect(guard.canActivate(mockContext('admin'))).toBe(true);
    expect(guard.canActivate(mockContext('gerente'))).toBe(true);
  });

  it('should deny cajero for admin-only route', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['admin']);
    expect(() => guard.canActivate(mockContext('cajero'))).toThrow(
      ForbiddenException,
    );
  });

  it('should deny gerente for admin-only route', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['admin']);
    expect(() => guard.canActivate(mockContext('gerente'))).toThrow(
      ForbiddenException,
    );
  });
});
