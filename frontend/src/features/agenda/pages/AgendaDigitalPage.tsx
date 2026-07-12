import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, FileText, Plus, X } from 'lucide-react';
import { TabNav } from '@shared/ui/TabNav';
import { LottieIcon } from '@shared/ui/LottieIcon';
import { Modal } from '@shared/ui/Modal';
import { useTheme } from '@contexts/ThemeContext';
import { Skeleton } from '@shared/ui/Skeleton';
import calendarAnim from '@assets/animations/calendar.json';
import bellAnim from '@assets/animations/bell.json';
import { api } from '@shared/lib/http/client';
import type { CalendarEvent } from '@types';
import styles from './AgendaDigitalPage.module.css';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const EVENT_COLORS = ['#f97316', '#16a34a', '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899'];

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildEventMap(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  events.forEach((ev) => {
    const key = ev.startDate.split('T')[0];
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  });
  return map;
}

export function AgendaDigitalPage() {
  const { config } = useTheme();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(
    formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [activeTab, setActiveTab] = useState('agenda');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState(EVENT_COLORS[0]);
  const [formAllDay, setFormAllDay] = useState(true);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');

  const fetchEvents = useCallback(async (year: number, month: number) => {
    setLoading(true);
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    try {
      const data = await api.getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchEvents]);

  const eventMap = useMemo(() => buildEventMap(events), [events]);

  const daysGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    const cells: { day: number; isCurrent: boolean; isPrev: boolean; dateStr: string }[] = [];

    for (let i = firstDayIndex; i > 0; i--) {
      cells.push({ day: prevTotalDays - i + 1, isCurrent: false, isPrev: true, dateStr: '' });
    }
    for (let day = 1; day <= totalDays; day++) {
      cells.push({
        day,
        isCurrent: true,
        isPrev: false,
        dateStr: formatDateKey(currentYear, currentMonth, day),
      });
    }
    const remaining = 42 - cells.length;
    for (let j = 1; j <= remaining; j++) {
      cells.push({ day: j, isCurrent: false, isPrev: false, dateStr: '' });
    }
    return cells;
  }, [currentYear, currentMonth]);

  const selectedDateEvents = useMemo(() => {
    return eventMap[selectedDateStr] || [];
  }, [eventMap, selectedDateStr]);

  const monthStats = useMemo(() => {
    let alerts = 0,
      audits = 0;
    events.forEach((ev) => {
      if (ev.color === '#f97316') alerts++;
      if (ev.color === '#16a34a' || !ev.color) audits++;
    });
    return { alerts, audits };
  }, [events]);

  const selectedDateDisplay = useMemo(() => {
    const parts = selectedDateStr.split('-');
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return `${+parts[2]} de ${MONTHS[d.getMonth()].toLowerCase()}, ${parts[0]}`;
  }, [selectedDateStr]);

  const navigatePrev = () => {
    setCurrentMonth((p) => {
      if (p === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return p - 1;
    });
  };

  const navigateNext = () => {
    setCurrentMonth((p) => {
      if (p === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return p + 1;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(formatDateKey(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    const startDate = formStart || new Date().toISOString().slice(0, 16);
    try {
      await api.createEvent({
        title: formTitle,
        description: formDesc || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: formEnd ? new Date(formEnd).toISOString() : undefined,
        allDay: formAllDay,
        color: formColor,
      });
      setShowCreateModal(false);
      setFormTitle('');
      setFormDesc('');
      setFormStart('');
      setFormEnd('');
      setFormAllDay(true);
      setFormColor(EVENT_COLORS[0]);
      fetchEvents(currentYear, currentMonth);
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteEvent(id);
      fetchEvents(currentYear, currentMonth);
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div className={`${styles.container} animate-entrance`}>
      <TabNav
        tabs={[{ key: 'agenda', label: 'Agenda Digital', icon: <CalendarDays size={16} /> }]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <LottieIcon src={calendarAnim} size={28} hoverPlay />
          <div>
            <h2 className={styles.headerTitle}>Planificador operativo y logs</h2>
            <p className={styles.headerSub}>
              Monitoreo de hitos comerciales, auditorías de inventario y alertas del sistema.
            </p>
          </div>
        </div>
        <div className={styles.headerControls}>
          <button className={styles.navBtn} onClick={navigatePrev}>
            <ChevronLeft size={14} />
          </button>
          <div className={styles.monthLabel}>
            {MONTHS[currentMonth].charAt(0).toUpperCase() +
              MONTHS[currentMonth].slice(1).toLowerCase()}{' '}
            {currentYear}
          </div>
          <button className={styles.navBtn} onClick={navigateNext}>
            <ChevronRight size={14} />
          </button>
          <button className={styles.todayBtn} onClick={goToToday}>
            Hoy
          </button>
          <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Nuevo Evento
          </button>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.calendarCard}>
          <div className={styles.accentBar} />
          <div className={styles.weekdayRow}>
            {WEEKDAYS.map((d, i) => (
              <div key={i} className={`${styles.weekday} ${i === 0 ? styles.weekdaySun : ''}`}>
                {d}
              </div>
            ))}
          </div>
          <div className={styles.daysGrid}>
            {daysGrid.map((cell, i) => {
              const dayEvents = cell.dateStr ? eventMap[cell.dateStr] || [] : [];
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday =
                cell.dateStr ===
                formatDateKey(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  new Date().getDate()
                );
              return (
                <div
                  key={i}
                  className={`${styles.dayCell} ${!cell.isCurrent ? styles.dayCellMuted : ''} ${isSelected ? styles.dayCellSelected : ''} ${isToday && cell.isCurrent ? styles.dayCellToday : ''}`}
                  onClick={() => cell.dateStr && setSelectedDateStr(cell.dateStr)}
                >
                  <span
                    className={`${styles.dayNum} ${!cell.isCurrent ? styles.dayNumMuted : ''} ${cell.dateStr && new Date(cell.dateStr).getDay() === 0 && cell.isCurrent ? styles.dayNumSun : ''} ${isSelected ? styles.dayNumSelected : ''}`}
                  >
                    {cell.day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className={styles.dayDots}>
                      {dayEvents.map((ev, j) => (
                        <span
                          key={j}
                          className={styles.dayDot}
                          style={{ '--dot-color': ev.color || '#888' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <LottieIcon src={bellAnim} size={20} hoverPlay />
            <span className={styles.sidebarTitle}>{selectedDateDisplay}</span>
          </div>
          <p className={styles.sidebarSub}>
            Historial logístico e incidencias registradas en esta fecha.
          </p>

          <div className={styles.eventsList}>
            {loading ? (
              <div className={styles.loadingSkeleton}>
                <Skeleton height={60} borderRadius={6} />
                <Skeleton height={60} borderRadius={6} />
                <Skeleton height={60} borderRadius={6} />
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className={styles.emptyEvents}>
                <FileText size={24} className={styles.iconMuted} />
                <p>No hay eventos registrados para esta fecha.</p>
              </div>
            ) : (
              selectedDateEvents.map((ev, i) => (
                <div
                  key={i}
                  className={styles.eventCard}
                  style={
                    {
                      '--event-color': ev.color || 'var(--text-muted)',
                      '--event-bg': ev.color ? `${ev.color}15` : 'rgba(136,136,136,0.1)',
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.eventCardFlex}>
                    <span className={styles.eventLabel}>{ev.title}</span>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className={styles.deleteBtn}
                      title="Eliminar evento"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {ev.description && <p className={styles.eventDesc}>{ev.description}</p>}
                  <span className={styles.eventType}>
                    {new Date(ev.startDate).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {ev.endDate
                      ? ` — ${new Date(ev.endDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className={styles.statsCard}>
            <span className={styles.statsTitle}>Resumen del Período</span>
            <div className={styles.statRow}>
              <span>Alertas Técnicas</span>
              <span className={`${styles.statValue} ${styles.statValueOrange}`}>
                {monthStats.alerts}
              </span>
            </div>
            <div className={styles.statRow}>
              <span>Auditorías Completadas</span>
              <span className={`${styles.statValue} ${styles.statValueGreen}`}>
                {monthStats.audits}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Evento">
        <div className={styles.formColumn}>
          <div>
            <label className={styles.formLabel}>Título</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className={styles.formInput}
              placeholder="Ej: Reunión con proveedores"
            />
          </div>
          <div>
            <label className={styles.formLabel}>Descripción</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className={styles.formTextarea}
              placeholder="Descripción opcional"
            />
          </div>
          <div className={styles.formGrid2}>
            <div>
              <label className={styles.formLabel}>Inicio</label>
              <input
                type="datetime-local"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className={styles.formInput}
              />
            </div>
            <div>
              <label className={styles.formLabel}>Fin</label>
              <input
                type="datetime-local"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className={styles.formInput}
              />
            </div>
          </div>
          <div>
            <label className={styles.formLabel}>Color</label>
            <div className={styles.colorPicker}>
              {EVENT_COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setFormColor(c)}
                  className={`${styles.colorCircle} ${formColor === c ? styles.colorCircleSelected : ''}`}
                  style={{ '--circle-color': c } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="allDay"
              checked={formAllDay}
              onChange={(e) => setFormAllDay(e.target.checked)}
            />
            <label htmlFor="allDay" className={styles.checkboxLabel}>
              Todo el día
            </label>
          </div>
          <button onClick={handleCreate} className={styles.submitBtn}>
            Crear Evento
          </button>
        </div>
      </Modal>
    </div>
  );
}
