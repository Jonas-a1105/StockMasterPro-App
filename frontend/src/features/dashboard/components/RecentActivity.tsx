import styles from '../pages/DashboardPage.module.css';

export function RecentActivity({ activities }: { activities: { title: string; desc: string; time: string; color: string }[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Actividad reciente del sistema</div>
      <div className={styles.cardBody}>
        {activities.length === 0 ? (
          <p className={styles.muted}>No hay actividad reciente.</p>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
            {activities.map((act, i) => (
              <div key={i} className="list-item-bordered" style={{ background: 'var(--bg-main, #1c1c1c)', padding: '10px 12px 10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', '--list-item-color': act.color } as React.CSSProperties}>
                <div>
                  <div style={{ fontWeight: 600, color: act.color === '#22c55e' ? 'var(--text-dark, #fff)' : 'var(--color-orange-red, #f97316)', fontSize: 13 }}>{act.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginTop: 1 }}>{act.desc}</div>
                </div>
                <span style={{ color: 'var(--text-muted, #555)', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
