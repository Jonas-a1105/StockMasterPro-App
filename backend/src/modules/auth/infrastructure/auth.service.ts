import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import type { AuthRepository } from '../application/ports/AuthRepository.interface';
import { RegisterTenant } from '../application/use-cases/RegisterTenant';
import { ValidateUser } from '../application/use-cases/ValidateUser';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject('AuthRepository')
    private readonly authRepo: AuthRepository,
  ) {}

  async register(dto: {
    tenantName: string;
    email: string;
    password: string;
    name: string;
  }) {
    const existingUser = await this.authRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const useCase = new RegisterTenant(this.authRepo);
    const { tenant, user } = await useCase.execute(
      dto.tenantName,
      dto.email,
      passwordHash,
      dto.name,
    );

    const token = this.jwtService.sign({
      uid: user.id,
      tenant_id: tenant.id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
      },
    };
  }

  async login(dto: { email: string; password: string }) {
    const validateUseCase = new ValidateUser(this.authRepo);
    const user = await validateUseCase.execute(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwtService.sign({
      uid: user.id,
      tenant_id: user.tenantId,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
