import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Text } from '@shared/ui/Text';
import styles from '../pages/DashboardPage.module.css';

const COLORS = ['#a3a3a3', '#22c55e', '#eab308', '#f97316', '#3b82f6'];

export function TopSellersDonut({
  data,
}: {
  data: { items: { name: string; qty: number; total: number; share: number }[]; totalQty: number };
}) {
  const { formatUsd } = useExchangeRate();

  if (data.items.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <Text variant="h4">Participación de top ventas</Text>
        </div>
        <div className={styles.cardBody}>
          <Text variant="description">No hay datos de ventas.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <Text variant="h4">Participación de top ventas</Text>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.bestSellersLayout}>
          <div className={styles.donutChartArea}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.items}
                  dataKey="qty"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={4}
                  cornerRadius={6}
                  stroke="none"
                >
                  {data.items.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card, #1c1c1c)',
                    border: '1px solid var(--border-color, #333)',
                    fontSize: '12px',
                    borderRadius: 0,
                  }}
                  labelStyle={{ color: 'var(--text-dark, #e5e5e5)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenter}>
              <div className={styles.donutCenterTotal}>Total</div>
              <div className={styles.donutCenterQty}>{data.totalQty} u.</div>
            </div>
          </div>
          <div className={styles.sellerTableWrap}>
            <table className={styles.sellerTable}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Ingreso</th>
                  <th>% Share</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div className={styles.sellerNameCell}>
                        <span
                          className={`${styles.sellerColorDot} ${styles.dotColor}`}
                          style={{ '--dot-color': COLORS[i] } as React.CSSProperties}
                        />
                        <Text
                          variant="bodySm"
                          weight="semibold"
                          className={styles.sellerName}
                          title={item.name}
                        >
                          {item.name.length > 22 ? item.name.slice(0, 20) + '...' : item.name}
                        </Text>
                      </div>
                    </td>
                    <td className={styles.sellerQty}>{item.qty} u.</td>
                    <td className={styles.sellerRevenue}>{formatUsd(item.total)}</td>
                    <td className={styles.sellerShare}>{item.share}%</td>
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
