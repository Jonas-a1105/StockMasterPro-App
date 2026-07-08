import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import styles from '../pages/DashboardPage.module.css';

export function TopSellersDonut({ data }: { data: { items: { name: string; qty: number; total: number; share: number }[]; totalQty: number } }) {
  const { formatUsd } = useExchangeRate();

  if (data.items.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.cardTitle}>Participación de top ventas</div>
        <div className={styles.cardBody}><p className={styles.muted}>No hay datos de ventas.</p></div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Participación de top ventas</div>
      <div className={styles.cardBody}>
        <div className={styles.bestSellersLayout}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.items} dataKey="qty" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} cornerRadius={6} stroke="none">
                  {data.items.map((_, index) => (
                    <Cell key={index} fill={['#a3a3a3', '#22c55e', '#eab308', '#f97316', '#3b82f6'][index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card, #1c1c1c)', border: '1px solid var(--border-color, #333)', fontSize: '12px', borderRadius: 0 }} labelStyle={{ color: 'var(--text-dark, #e5e5e5)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted, #888)', fontWeight: 600, textTransform: "none", letterSpacing: '0.5px' }}>Total</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark, #fff)' }}>{data.totalQty} u.</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: 'var(--text-dark, #ccc)' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted, #888)', textTransform: "none", fontSize: 9, letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color, #2a2a2a)' }}>
                  <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 600 }}>Producto</th>
                  <th style={{ paddingBottom: 8, textAlign: 'right', width: 64, fontWeight: 600 }}>Cant.</th>
                  <th style={{ paddingBottom: 8, textAlign: 'right', width: 96, fontWeight: 600 }}>Ingreso</th>
                  <th style={{ paddingBottom: 8, textAlign: 'right', width: 72, fontWeight: 600 }}>% Share</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color, #222)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, backgroundColor: ['#a3a3a3', '#22c55e', '#eab308', '#f97316', '#3b82f6'][i], display: 'inline-block', flexShrink: 0 }} />
                        <div><div style={{ color: i === 0 ? 'var(--text-dark, #fff)' : 'var(--text-dark, #ccc)', fontWeight: 600, fontSize: 13, lineHeight: 1.3 }} title={item.name}>{item.name.length > 22 ? item.name.slice(0, 20) + '...' : item.name}</div></div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-muted, #888)' }}>{item.qty} u.</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-dark, #fff)' }}>{formatUsd(item.total)}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: i === 0 ? 'var(--text-dark, #fff)' : 'var(--text-dark, #ccc)', fontSize: 13 }}>{item.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
