import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventRepository } from '../core/interfaces/EventRepository.interface';
import { CalendarEvent } from '../domain/CalendarEvent';

@Injectable()
export class PostgresEventRepo implements EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: { tenantId },
      orderBy: { startDate: 'asc' },
    });
    return rows.map(r => this.toDomain(r));
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    const r = await this.prisma.calendarEvent.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByDateRange(tenantId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: {
        tenantId,
        startDate: { gte: start, lte: end },
      },
      orderBy: { startDate: 'asc' },
    });
    return rows.map(r => this.toDomain(r));
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
  }): Promise<CalendarEvent> {
    const r = await this.prisma.calendarEvent.create({
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
    return this.toDomain(r);
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    allDay?: boolean;
    color?: string;
  }): Promise<CalendarEvent> {
    const r = await this.prisma.calendarEvent.update({ where: { id }, data });
    return this.toDomain(r);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.calendarEvent.delete({ where: { id } });
  }

  private toDomain(r: any): CalendarEvent {
    return new CalendarEvent(
      r.id, r.tenantId, r.title, r.description,
      r.startDate, r.endDate, r.allDay, r.color,
      r.createdBy, r.createdAt, r.updatedAt,
    );
  }
}
