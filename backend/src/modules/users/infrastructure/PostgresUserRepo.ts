import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../core/interfaces/UserRepository.interface';
import { User } from '../domain/User';

@Injectable()
export class PostgresUserRepo implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return users.map((u) => this.toUser(u));
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    const u = await this.prisma.user.findFirst({ where: { id, tenantId } });
    return u ? this.toUser(u) : null;
  }

  async create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<User> {
    const u = await this.prisma.user.create({ data });
    return this.toUser(u);
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
  ): Promise<User> {
    const u = await this.prisma.user.update({ where: { id }, data });
    return this.toUser(u);
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toUser(u: any): User {
    return new User(
      u.id,
      u.tenantId,
      u.email,
      u.name,
      u.role,
      u.isActive,
      u.createdAt,
      u.updatedAt,
    );
  }
}
