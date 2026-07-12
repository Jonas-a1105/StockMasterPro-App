import styles from '../pages/DashboardPage.module.css';

export function RecentActivity({ activities }: { activities: { title: string; desc: string; time: string; color: string }[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Actividad reciente del sistema</div>
      <div className={styles.cardBody}>
        {activities.length === 0 ? (
          <p className={styles.muted}>No hay actividad reciente.</p>
        ) : (
          <div className={`${styles.flexCol} ${styles.gap8} ${styles.overflowYAuto} ${styles.maxH200} ${styles.paddingRight4}`}>
            {activities.map((act, i) => (
              <div key={i} className={`list-item-bordered ${styles.flexRow} ${styles.justifyBetween} ${styles.itemsStart} ${styles.bgMainBg} ${styles.p10_12_10_18}`} style={{ '--list-item-color': act.color } as React.CSSProperties}>
                <div>
                  <div className={`${styles.fontWeight600} ${styles.fontSize13} ${styles.activityTitle}`} style={{ '--title-color': act.color === '#22c55e' ? 'var(--text-dark, #fff)' : 'var(--color-orange-red, #f97316)' } as React.CSSProperties}>{act.title}</div>
                  <div className={`${styles.fontSize11} ${styles.colorMuted} ${styles.mt1}`}>{act.desc}</div>
                </div>
                <span className={`${styles.fontSize10} ${styles.activityTime} ${styles.whitespaceNowrap} ${styles.marginLeft8}`}>{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
