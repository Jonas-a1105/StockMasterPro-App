import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(tenantId: string, name: string) {
    return this.prisma.category.create({
      data: { tenantId, name },
    });
  }

  async update(id: string, tenantId: string, name: string) {
    await this.findById(id, tenantId);
    return this.prisma.category.update({
      where: { id },
      data: { name },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
