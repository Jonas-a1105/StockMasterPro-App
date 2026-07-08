export class CalendarEvent {
  constructor(
    public readonly id: string,
    public tenantId: string,
    public title: string,
    public description: string | null,
    public startDate: Date,
    public endDate: Date | null,
    public allDay: boolean,
    public color: string | null,
    public createdBy: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
