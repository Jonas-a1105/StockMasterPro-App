import { CalendarEvent } from '../../domain/CalendarEvent';

export interface EventRepository {
  findAll(tenantId: string): Promise<CalendarEvent[]>;
  findById(id: string, tenantId: string): Promise<CalendarEvent | null>;
  findByDateRange(tenantId: string, start: Date, end: Date): Promise<CalendarEvent[]>;
  create(data: {
    tenantId: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    allDay?: boolean;
    color?: string;
    createdBy: string;
  }): Promise<CalendarEvent>;
  update(id: string, tenantId: string, data: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    allDay?: boolean;
    color?: string;
  }): Promise<CalendarEvent>;
  delete(id: string, tenantId: string): Promise<void>;
}
