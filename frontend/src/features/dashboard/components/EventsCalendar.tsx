import styles from '../pages/DashboardPage.module.css';

export function EventsCalendar({ todaySales, lowStockProducts }: { todaySales: any[]; lowStockProducts: any[] }) {
  const hasEvents = todaySales.length > 0 || lowStockProducts.length > 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Calendario de eventos</div>
      <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'row', gap: 0, padding: 0 }}>
        <div style={{ width: '40%', padding: '16px 16px 16px 0', borderRight: '1px solid var(--border-color, #222)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--color-danger, #ff453a)', lineHeight: 1 }}>{new Date().getDate()}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: 'var(--text-dark, #fff)' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginBottom: 16 }}>
            {new Date().toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())} • {lowStockProducts.length + todaySales.length} Eventos
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => {
              const dayNum = new Date().getDate() - new Date().getDay() + i;
              const isToday = dayNum === new Date().getDate();
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 10, color: isToday ? 'var(--text-dark, #fff)' : 'var(--text-muted, #666)' }}>
                  <span style={{ opacity: isToday ? 1 : 0.5 }}>{dayNum}</span>
                  <span style={isToday ? { background: '#fff', color: '#000', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 } : {}}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ width: '60%', padding: '16px 0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 160 }}>
          {!hasEvents ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-muted, #888)' }}>No hay eventos registrados hoy.</div>
          ) : (
            <>
              {todaySales.slice(0, 3).map((s, i) => (
                <div key={`s-${i}`} className="list-item-bordered" style={{ paddingLeft: 14, '--list-item-color': '#22c55e' } as React.CSSProperties}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-dark, #e5e5e5)', lineHeight: 1.3, marginBottom: 2 }}>Venta {s.invoiceNumber ? `#${s.invoiceNumber}` : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>${(s.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {s.paymentMethod || 'Caja Central'}</div>
                </div>
              ))}
              {lowStockProducts.slice(0, 2).map((p, i) => (
                <div key={`l-${i}`} className="list-item-bordered" style={{ paddingLeft: 14, '--list-item-color': '#f97316' } as React.CSSProperties}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-orange-red, #f97316)', lineHeight: 1.3, marginBottom: 2 }}>Stock Bajo: {p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>{p.stock} / {p.minStock} unidades</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
