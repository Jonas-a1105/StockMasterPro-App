import { JwtAuthGuard } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockContext = (isPublic: boolean) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    }) as any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);
  });

  it('should allow access to public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    expect(guard.canActivate(mockContext(true))).toBe(true);
  });

  it('should throw UnauthorizedException when user is missing', () => {
    expect(() => (guard as any).handleRequest(null, null)).toThrow(
      'Token inválido o expirado',
    );
  });

  it('should return user when valid', () => {
    const user = { id: 'user-1', tenantId: 'tenant-1' };
    expect((guard as any).handleRequest(null, user)).toBe(user);
  });

  it('should propagate error from passport', () => {
    expect(() =>
      (guard as any).handleRequest(new Error('Token expired'), null),
    ).toThrow('Token expired');
  });

  it('should delegate to passport for non-public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jest
      .spyOn(Object.getPrototypeOf(guard), 'canActivate')
      .mockResolvedValue(true);
    expect(guard.canActivate(mockContext(false))).toBeInstanceOf(Promise);
  });
});
