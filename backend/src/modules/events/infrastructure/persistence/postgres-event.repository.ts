import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PostgresEventRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { tenantId },
      orderBy: { startDate: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.calendarEvent.findFirst({ where: { id, tenantId } });
  }

  async findByDateRange(tenantId: string, start: Date, end: Date) {
    return this.prisma.calendarEvent.findMany({
      where: {
        tenantId,
        startDate: { gte: start, lte: end },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async create(data: {
    tenantId: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    allDay?: boolean;
    color?: string;
    createdBy: string;
  }) {
    return this.prisma.calendarEvent.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        allDay: data.allDay ?? false,
        color: data.color,
        createdBy: data.createdBy,
      },
    });
  }

  async update(id: string, tenantId: string, data: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    allDay?: boolean;
    color?: string;
  }) {
    const { count } = await this.prisma.calendarEvent.updateMany({
      where: { id, tenantId },
      data,
    });
    if (count === 0) throw new NotFoundException('Evento no encontrado');
    return this.prisma.calendarEvent.findFirst({ where: { id, tenantId } });
  }

  async delete(id: string, tenantId: string) {
    const { count } = await this.prisma.calendarEvent.deleteMany({
      where: { id, tenantId },
    });
    if (count === 0) throw new NotFoundException('Evento no encontrado');
  }
}
