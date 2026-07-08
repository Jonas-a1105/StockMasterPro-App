import { CalendarEvent } from './CalendarEvent';

describe('CalendarEvent', () => {
  it('should create an event with required fields', () => {
    const now = new Date();
    const ev = new CalendarEvent(
      'ev-1', 'tenant-1', 'Reunión', null,
      now, null, false, null, 'user-1', now, now,
    );
    expect(ev.title).toBe('Reunión');
    expect(ev.allDay).toBe(false);
  });

  it('should create an all-day event', () => {
    const now = new Date();
    const ev = new CalendarEvent(
      'ev-2', 'tenant-1', 'Todo el día', 'Descripción',
      now, null, true, '#f97316', 'user-1', now, now,
    );
    expect(ev.allDay).toBe(true);
    expect(ev.color).toBe('#f97316');
    expect(ev.description).toBe('Descripción');
  });
});
