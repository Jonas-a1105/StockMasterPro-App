import { useState, useEffect, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { LottieIcon } from '@shared/ui/LottieIcon';
import walletData from '@assets/lottie/wallet.json';
import creditCardData from '@assets/lottie/credit-card.json';
import shoppingBagData from '@assets/lottie/shopping-bag.json';
import analyticsData from '@assets/lottie/analytics.json';
import warningData from '@assets/lottie/warning.json';
import trendingUpData from '@assets/lottie/trending-up.json';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useTheme } from '@contexts/ThemeContext';
import { SkeletonKPI, SkeletonChart } from '@shared/ui/Skeleton';
import styles from './DashboardPage.module.css';

function groupSalesByDate(sales: any[]) {
  const map: Record<string, number> = {};
  sales.forEach(s => {
    const date = s.createdAt?.split('T')[0];
    if (date) {
      map[date] = (map[date] || 0) + s.total;
    }
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total * 100) / 100 }));
}

function getBestSellers(sales: any[], products: any[]) {
  const productCount: Record<string, { name: string; qty: number; total: number }> = {};
  sales.forEach(s => {
    (s.items || []).forEach((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      const name = prod?.name || item.productName || 'Producto Eliminado';
      if (!productCount[name]) productCount[name] = { name, qty: 0, total: 0 };
      productCount[name].qty += item.quantity;
      productCount[name].total += item.subtotal;
    });
  });
  return Object.values(productCount)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
}

function getNetProfit(sales: any[]) {
  return sales.reduce((sum, s) => {
    const cost = (s.items || []).reduce((c: number, i: any) => c + (i.cost || 0) * i.quantity, 0);
    return sum + (s.total - cost);
  }, 0);
}

export function DashboardPage() {
  const [summary, setSummary] = useState({ total: 0, count: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDailySummary().then(setSummary).catch(() => {}),
      api.getProducts().then(setProducts).catch(() => {}),
      api.getSales(100).then(setSales).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= p.minStock), [products]);
  const recentActivity = useMemo(() => {
    const items: { title: string; desc: string; time: string; color: string }[] = [];
    const now = Date.now();
    sales.slice(0, 4).forEach(s => {
      const diff = now - new Date(s.createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      const time = mins < 60 ? `Hace ${mins} min` : mins < 1440 ? `Hace ${Math.floor(mins / 60)} hr` : `Hace ${Math.floor(mins / 1440)} día${Math.floor(mins / 1440) > 1 ? 's' : ''}`;
      items.push({ title: `Venta registrada ${s.invoiceNumber ? `#${s.invoiceNumber}` : ''}`, desc: `Total $${(s.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${s.paymentMethod || 'Caja Central'}`, time, color: '#22c55e' });
    });
    lowStockProducts.slice(0, 3).forEach(p => {
      items.push({ title: `Alerta: Stock Mínimo - ${p.name}`, desc: `Producto '${p.name}' alcanzó el límite de resguardo.`, time: 'Reciente', color: '#f97316' });
    });
    return items;
  }, [sales, lowStockProducts]);
  const totalStock = useMemo(() => products.reduce((sum, p) => sum + p.stock, 0), [products]);
  const salesChartData = useMemo(() => groupSalesByDate(sales), [sales]);
  const bestSellers = useMemo(() => getBestSellers(sales, products), [sales, products]);
  const bestSellersData = useMemo(() => {
    const totalQty = bestSellers.reduce((sum, p) => sum + p.qty, 0);
    return {
      items: bestSellers.map(p => ({
        ...p,
        share: totalQty > 0 ? Math.round((p.qty / totalQty) * 100) : 0,
      })),
      totalQty,
    };
  }, [bestSellers]);
  const netProfit = useMemo(() => getNetProfit(sales), [sales]);
  const todaySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter(s => s.createdAt?.startsWith(today));
  }, [sales]);
  const { formatPrice, formatUsd } = useExchangeRate();
  const { config } = useTheme();

  if (loading && config.skeletonEnabled) {
    return (
      <>
        <SkeletonKPI count={6} />
        <div className={styles.grid} style={{ marginTop: 16 }}>
          <div className={styles.card}>
            <SkeletonChart height={250} />
          </div>
          <div className={styles.card}>
            <SkeletonChart height={250} />
          </div>
        </div>
      </>
    );
  }

  const kpis = [
    { key: 'total', cls: styles.total, icon: walletData, title: 'Ventas hoy', value: formatPrice(summary.total) },
    { key: 'views', cls: styles.views, icon: creditCardData, title: 'Transacciones', value: summary.count },
    { key: 'visitors', cls: styles.visitors, icon: shoppingBagData, title: 'Productos', value: products.length },
    { key: 'shares', cls: styles.shares, icon: analyticsData, title: 'Stock total', value: totalStock },
    { key: 'low', cls: styles.low, icon: warningData, title: 'Stock bajo', value: lowStockProducts.length },
    { key: 'profit', cls: styles.profit, icon: trendingUpData, title: 'Utilidad neta', value: formatPrice(netProfit) },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.kpiContainer} onMouseLeave={() => setHoveredKpi(null)}>
        {kpis.map(k => (
          <div
            key={k.key}
            className={`${styles.kpiCard} ${k.cls}`}
            onMouseEnter={() => setHoveredKpi(k.key)}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconBox}>
              <LottieIcon data={k.icon} size={22} play={hoveredKpi === k.key} />
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiTitle}>{k.title}</div>
              <div className={styles.kpiValue}>
                {typeof k.value === 'string' && k.value.includes(' · ') ? (
                  <>
                    <span>{k.value.split(' · ')[0]}</span>
                    <span className={styles.kpiSubValue}>{k.value.split(' · ')[1]}</span>
                  </>
                ) : (
                  k.value
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Ventas últimos 7 días</div>
          <div className={styles.cardBody}>
            {salesChartData.length === 0 ? (
              <p className={styles.muted}>No hay datos de ventas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--text-muted, #888)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted, #888)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card, #fff)',
                      border: '1px solid var(--border-color, #eee)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--color-orange-red, #f05a28)" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" dot={{ r: 3 }} animationDuration={1200} animationBegin={200} animationEasing="ease-in-out" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Participación de top ventas</div>
          <div className={styles.cardBody}>
            {bestSellers.length === 0 ? (
              <p className={styles.muted}>No hay datos de ventas.</p>
            ) : (
              <div className={styles.bestSellersLayout}>
                {/* Donut Chart */}
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={bestSellersData.items} dataKey="qty" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} cornerRadius={6} stroke="none">
                        {bestSellersData.items.map((_, index) => (
                          <Cell key={index} fill={['#a3a3a3', '#22c55e', '#eab308', '#f97316', '#3b82f6'][index]} />
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
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted, #888)', fontWeight: 600, textTransform: "none", letterSpacing: '0.5px' }}>Total</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark, #fff)', fontFamily: "'Courier New', Courier, monospace" }}>{bestSellersData.totalQty} u.</div>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: 'var(--text-dark, #ccc)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted, #888)', textTransform: "none", fontSize: 9, letterSpacing: '0.5px', fontFamily: "'Courier New', Courier, monospace", borderBottom: '1px solid var(--border-color, #2a2a2a)' }}>
                        <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 600 }}>Producto</th>
                        <th style={{ paddingBottom: 8, textAlign: 'right', width: 64, fontWeight: 600 }}>Cant.</th>
                        <th style={{ paddingBottom: 8, textAlign: 'right', width: 96, fontWeight: 600 }}>Ingreso</th>
                        <th style={{ paddingBottom: 8, textAlign: 'right', width: 72, fontWeight: 600 }}>% Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestSellersData.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color, #222)', transition: 'background 0.15s ease' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '10px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 10, height: 10, backgroundColor: ['#a3a3a3', '#22c55e', '#eab308', '#f97316', '#3b82f6'][i], display: 'inline-block', flexShrink: 0 }} />
                              <div>
                                <div style={{ color: i === 0 ? 'var(--text-dark, #fff)' : 'var(--text-dark, #ccc)', fontWeight: 600, fontSize: 13, lineHeight: 1.3 }} title={item.name}>
                                  {item.name.length > 22 ? item.name.slice(0, 20) + '...' : item.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: "'Courier New', Courier, monospace", color: 'var(--text-muted, #888)' }}>{item.qty} u.</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: "'Courier New', Courier, monospace", color: 'var(--text-dark, #fff)' }}>{formatUsd(item.total)}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: "'Courier New', Courier, monospace", color: i === 0 ? 'var(--text-dark, #fff)' : 'var(--text-dark, #ccc)', fontSize: 13 }}>{item.share}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid3}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Actividad reciente del sistema</div>
          <div className={styles.cardBody}>
            {recentActivity.length === 0 ? (
              <p className={styles.muted}>No hay actividad reciente.</p>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                {recentActivity.map((act, i) => (
                  <div
                    key={i}
                    className="list-item-bordered"
                    style={{
                      background: 'var(--bg-main, #1c1c1c)',
                      padding: '10px 12px 10px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      '--list-item-color': act.color
                    } as React.CSSProperties}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: act.color === '#22c55e' ? 'var(--text-dark, #fff)' : 'var(--color-orange-red, #f97316)', fontSize: 13 }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginTop: 1 }}>{act.desc}</div>
                    </div>
                    <span style={{ fontFamily: "'Courier New', Courier, monospace", color: 'var(--text-muted, #555)', fontSize: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Alertas de stock crítico</div>
          <div className={styles.cardBody}>
            {lowStockProducts.length === 0 ? (
              <p className={styles.muted}>No hay productos con stock bajo.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main, #1c1c1c)', color: 'var(--text-muted, #888)', textTransform: "none", fontSize: 9, letterSpacing: '0.5px', fontFamily: "'Courier New', Courier, monospace", borderBottom: '1px solid var(--border-color, #333)' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Producto</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Código</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Mínimo</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Disponible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.slice(0, 10).map(p => {
                      const isBelowMin = p.stock < p.minStock;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color, #222)', transition: 'background 0.15s ease' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main, #111)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '10px 10px', color: 'var(--text-dark, #fff)', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '10px 10px', fontFamily: "'Courier New', Courier, monospace", color: 'var(--text-muted, #888)' }}>{p.barcode || '—'}</td>
                          <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: "'Courier New', Courier, monospace", color: 'var(--text-muted, #888)' }}>{p.minStock} u.</td>
                          <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: "'Courier New', Courier, monospace", fontWeight: 700, color: isBelowMin ? 'var(--color-danger, #dc2626)' : 'var(--color-orange-red, #f97316)' }}>{p.stock} u.</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Calendario de eventos</div>
          <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'row', gap: 0, padding: 0 }}>
            {/* Left: Date + Week strip */}
            <div style={{ width: '40%', padding: '16px 16px 16px 0', borderRight: '1px solid var(--border-color, #222)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--color-danger, #ff453a)', lineHeight: 1 }}>{new Date().getDate()}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: 'var(--text-dark, #fff)' }}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginBottom: 16 }}>
                {new Date().toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())} • {lowStockProducts.length + recentActivity.length} Eventos
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

            {/* Right: Events */}
            <div style={{ width: '60%', padding: '16px 0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 160 }}>
              {todaySales.length === 0 && lowStockProducts.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-muted, #888)' }}>
                  No hay eventos registrados hoy.
                </div>
              ) : (
                <>
                  {todaySales.slice(0, 3).map((s, i) => (
                    <div
                      key={`s-${i}`}
                      className="list-item-bordered"
                      style={{
                        paddingLeft: 14,
                        '--list-item-color': '#22c55e'
                      } as React.CSSProperties}
                    >
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-dark, #e5e5e5)', lineHeight: 1.3, marginBottom: 2 }}>
                        Venta {s.invoiceNumber ? `#${s.invoiceNumber}` : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>
                        ${(s.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {s.paymentMethod || 'Caja Central'}
                      </div>
                    </div>
                  ))}
                  {lowStockProducts.slice(0, 2).map((p, i) => (
                    <div
                      key={`l-${i}`}
                      className="list-item-bordered"
                      style={{
                        paddingLeft: 14,
                        '--list-item-color': '#f97316'
                      } as React.CSSProperties}
                    >
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-orange-red, #f97316)', lineHeight: 1.3, marginBottom: 2 }}>
                        Stock Bajo: {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>
                        {p.stock} / {p.minStock} unidades
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
