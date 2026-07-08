import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PostgresUserRepo } from './persistence/PostgresUserRepo';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: PostgresUserRepo,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(tenantId: string) {
    return this.userRepo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    const user = await this.userRepo.findById(id, tenantId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(data: {
    tenantId: string;
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.userRepo.create({
      tenantId: data.tenantId,
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || 'cajero',
    });
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findById(id, tenantId);

    if (data.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== id)
        throw new ConflictException('El email ya está registrado');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.userRepo.update(id, tenantId, updateData);
  }

  async delete(id: string, tenantId: string) {
    const user = await this.findById(id, tenantId);
    if (user.role === 'admin')
      throw new NotFoundException('No se puede eliminar un administrador');
    return this.userRepo.delete(id, tenantId);
  }
}
