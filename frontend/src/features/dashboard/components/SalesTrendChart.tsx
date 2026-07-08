import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../pages/DashboardPage.module.css';

export function SalesTrendChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Ventas últimos 7 días</div>
      <div className={styles.cardBody}>
        {data.length === 0 ? (
          <p className={styles.muted}>No hay datos de ventas.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--text-muted, #888)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted, #888)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #eee)', borderRadius: '8px', fontSize: '13px' }} />
              <Area type="monotone" dataKey="total" stroke="var(--color-orange-red, #f05a28)" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" dot={{ r: 3 }} animationDuration={1200} animationBegin={200} animationEasing="ease-in-out" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
