import styles from '../pages/DashboardPage.module.css';

export function EventsCalendar({
  todaySales,
  lowStockProducts,
}: {
  todaySales: any[];
  lowStockProducts: any[];
}) {
  const hasEvents = todaySales.length > 0 || lowStockProducts.length > 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Calendario de eventos</div>
      <div className={`${styles.cardBody} ${styles.flexRow} ${styles.gap0} ${styles.p0}`}>
        <div
          className={`${styles.w40} ${styles.p16_0_16_16} ${styles.borderRight} ${styles.flexCol}`}
        >
          <div
            className={`${styles.fontSize40} ${styles.fontWeight700} ${styles.colorDanger} ${styles.lineHeight1}`}
          >
            {new Date().getDate()}
          </div>
          <div
            className={`${styles.fontSize14} ${styles.fontWeight600} ${styles.mt2} ${styles.colorDark}`}
          >
            {new Date()
              .toLocaleDateString('es-ES', { weekday: 'long' })
              .replace(/^\w/, (c) => c.toUpperCase())}
          </div>
          <div className={`${styles.fontSize11} ${styles.colorMuted} ${styles.mb16}`}>
            {new Date()
              .toLocaleDateString('es-ES', { month: 'long' })
              .replace(/^\w/, (c) => c.toUpperCase())}{' '}
            • {lowStockProducts.length + todaySales.length} Eventos
          </div>
          <div className={`${styles.flexBetween} ${styles.mtAuto}`}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => {
              const dayNum = new Date().getDate() - new Date().getDay() + i;
              const isToday = dayNum === new Date().getDate();
              return (
                <div
                  key={i}
                  className={`${styles.flexCol} ${styles.itemsCenter} ${styles.gap4} ${styles.fontSize10} ${isToday ? styles.colorDark : styles.colorMuted}`}
                >
                  <span className={isToday ? styles.opacity100 : styles.opacity50}>{dayNum}</span>
                  <span
                    className={
                      isToday
                        ? `${styles.bgWhite} ${styles.colorBlack} ${styles.rounded50} ${styles.w20} ${styles.h20} ${styles.flexCenter} ${styles.fontWeight600}`
                        : ''
                    }
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div
          className={`${styles.w60} ${styles.p16_0_16_16} ${styles.flexCol} ${styles.gap10} ${styles.overflowYAuto} ${styles.maxH160}`}
        >
          {!hasEvents ? (
            <div
              className={`${styles.p16} ${styles.textCenter} ${styles.fontSize11} ${styles.colorMuted}`}
            >
              No hay eventos registrados hoy.
            </div>
          ) : (
            <>
              {todaySales.slice(0, 3).map((s, i) => (
                <div
                  key={`s-${i}`}
                  className={`${styles.paddingLeft14} ${styles.whitespaceNowrap}`}
                  style={{ '--list-item-color': '#22c55e' }}
                >
                  <div
                    className={`${styles.fontSize12} ${styles.fontWeight500} ${styles.colorDark} ${styles.lineHeight13} ${styles.mb2}`}
                  >
                    Venta {s.invoiceNumber ? `#${s.invoiceNumber}` : ''}
                  </div>
                  <div className={`${styles.fontSize11} ${styles.colorMuted}`}>
                    $
                    {(s.total || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    • {s.paymentMethod || 'Caja Central'}
                  </div>
                </div>
              ))}
              {lowStockProducts.slice(0, 2).map((p, i) => (
                <div
                  key={`l-${i}`}
                  className={`${styles.paddingLeft14} ${styles.whitespaceNowrap}`}
                  style={{ '--list-item-color': '#f97316' }}
                >
                  <div
                    className={`${styles.fontSize12} ${styles.fontWeight500} ${styles.colorOrangeRed} ${styles.lineHeight13} ${styles.mb2}`}
                  >
                    Stock Bajo: {p.name}
                  </div>
                  <div className={`${styles.fontSize11} ${styles.colorMuted}`}>
                    {p.stock} / {p.minStock} unidades
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
