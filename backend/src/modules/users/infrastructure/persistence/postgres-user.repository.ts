import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PostgresUserRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, tenantId: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { id: true, tenantId: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });
  }

  async create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      email: string;
      name: string;
      role: string;
      isActive: boolean;
    }>,
  ) {
    const { count } = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data,
    });
    if (count === 0) throw new NotFoundException('Usuario no encontrado');
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { count } = await this.prisma.user.deleteMany({
      where: { id, tenantId },
    });
    if (count === 0) throw new NotFoundException('Usuario no encontrado');
  }
}
