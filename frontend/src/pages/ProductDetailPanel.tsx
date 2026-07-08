import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Package } from 'lucide-react';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { Skeleton, SkeletonTable } from '../components/common/Skeleton';
import type { Product, InventoryMovement } from '../types';
import styles from './ProductDetailPanel.module.css';

interface ProductDetailPanelProps {
  product: Product;
  movements: InventoryMovement[];
  loadingMovements: boolean;
  getCategoryName: (id: string | null) => string;
}

export function ProductDetailPanel({ product, movements, loadingMovements, getCategoryName }: ProductDetailPanelProps) {
  const { rate, formatBs, formatUsd } = useExchangeRate();
  const [activeTab, setActiveTab] = useState<'general' | 'kardex'>('general');
  const [apiRate, setApiRate] = useState(rate || 652.97);
  const [refPrice, setRefPrice] = useState(product.price);

  const costUSD = product.cost;
  const saleBS = refPrice * apiRate;
  const profitUSD = refPrice - costUSD;
  const profitBS = profitUSD * apiRate;

  const profitChartData = [
    { name: 'COSTO', value: costUSD },
    { name: 'VENTA', value: refPrice },
    { name: 'GANANCIA', value: profitUSD },
  ];

  const profitBarColor = profitUSD >= 0 ? '#10b981' : '#ef4444';

  const stockChartData = useMemo(() => {
    if (!movements.length) {
      return [{ date: 'Hoy', stock: product.stock }];
    }
    const sorted = [...movements].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const totalChange = movements.reduce((sum, m) => sum + m.quantity, 0);
    let stockTracker = product.stock - totalChange;
    const data: { date: string; stock: number }[] = [];

    data.push({
      date: new Date(
        new Date(sorted[0].createdAt).getTime() - 24 * 60 * 60 * 1000
      ).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      stock: stockTracker,
    });

    for (const m of sorted) {
      stockTracker += m.quantity;
      data.push({
        date: new Date(m.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
        }),
        stock: stockTracker,
      });
    }
    return data;
  }, [movements, product.stock]);

  const kardexRows = useMemo(() => {
    if (!movements.length) return [];
    const sorted = [...movements].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const totalChange = movements.reduce((sum, m) => sum + m.quantity, 0);
    let runningBalance = product.stock - totalChange;

    return sorted.map((m) => {
      runningBalance += m.quantity;
      const desc =
        m.notes ||
        (m.reference ? `${m.reference}` : '') ||
        m.type ||
        'Movimiento';
      return {
        date: new Date(m.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        description: desc,
        entry: m.quantity > 0 ? m.quantity : null,
        exit: m.quantity < 0 ? Math.abs(m.quantity) : null,
        balance: runningBalance,
      };
    });
  }, [movements, product.stock]);

  const kardexChartData = useMemo(() => {
    const grouped: Record<string, { entries: number; exits: number }> = {};
    for (const m of movements) {
      const date = new Date(m.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      });
      if (!grouped[date]) grouped[date] = { entries: 0, exits: 0 };
      if (m.quantity > 0) grouped[date].entries += m.quantity;
      else grouped[date].exits += Math.abs(m.quantity);
    }
    return Object.entries(grouped).map(([date, data]) => ({
      date,
      ...data,
    }));
  }, [movements]);

  const formatterBS = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatterUSD = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className={styles.panel}>
      <div className={styles.tabbar}>
        <button
          className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('general')}
        >
          VISTA GENERAL
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'kardex' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('kardex')}
        >
          KARDEX DE INVENTARIO
        </button>
      </div>

      {activeTab === 'general' && (
        <div className={styles.panel}>
          <div className={styles.grid3}>
            {/* Columna Identidad Producto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className={styles.card}>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <Package size={40} />
                  </div>
                )}
              </div>

              <div className={styles.cardColumn}>
                <div>
                  <span className={styles.label}>NOMBRE</span>
                  <span className={styles.productName}>{product.name}</span>
                </div>
                <div className={styles.subGrid}>
                  <div>
                    <span className={styles.label}>MARCA</span>
                    <span className={styles.value}>{product.brand || '—'}</span>
                  </div>
                  <div>
                    <span className={styles.label}>CATEGORÍA</span>
                    <span className={styles.value}>{getCategoryName(product.categoryId)}</span>
                  </div>
                </div>
                <div className={styles.subGrid}>
                  <div>
                    <span className={styles.label}>CÓDIGO DE BARRAS</span>
                    <span className={styles.valueMono}>{product.barcode || '—'}</span>
                  </div>
                  <div>
                    <span className={styles.label}>STOCK ACTUAL</span>
                    <span className={styles.valueStock}>
                      {product.stock}{' '}
                      <span className={styles.stockMin}>
                        (mín: {product.minStock})
                      </span>
                    </span>
                  </div>
                </div>
                {product.description && (
                  <div className={styles.subCard}>
                    <span className={styles.label}>DESCRIPCIÓN</span>
                    <p className={styles.description}>{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Control Referencia & API */}
            <div className={styles.cardColumn}>
              <div>
                <span className={styles.sectionTitle}>CONTROL DE REFERENCIA & API</span>
                <div className={styles.apiGrid}>
                  <div className={styles.subCard}>
                    <label className={styles.label}>TASA API (Bs/$)</label>
                    <input
                      type="number"
                      value={apiRate}
                      onChange={(e) => setApiRate(parseFloat(e.target.value) || 0)}
                      className={styles.apiInput}
                    />
                  </div>
                  <div className={styles.subCard}>
                    <label className={styles.label}>REF. VENTA ($)</label>
                    <input
                      type="number"
                      value={refPrice}
                      step="0.1"
                      onChange={(e) => setRefPrice(parseFloat(e.target.value) || 0)}
                      className={styles.apiInput}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.subCard}>
                <div className={styles.financialRow}>
                  <span className={styles.financialLabel}>Costo Base:</span>
                  <span className={styles.financialValue}>
                    $ {formatterUSD.format(costUSD)}{' '}
                    <span className={styles.financialValueSecondary}>
                      / Bs {formatterBS.format(costUSD * apiRate)}
                    </span>
                  </span>
                </div>
                <hr className={styles.financialDivider} />
                <div className={styles.financialRow}>
                  <span className={styles.financialLabel}>
                    Precio Venta Estimado:
                  </span>
                  <span className={styles.financialValue}>
                    $ {formatterUSD.format(refPrice)}{' '}
                    <span className={styles.financialValueSecondary}>
                      / Bs {formatterBS.format(saleBS)}
                    </span>
                  </span>
                </div>
                <hr className={styles.profitDivider} />
                <div className={styles.profitRow}>
                  <span className={styles.profitLabel}>
                    GANANCIA ESTIMADA:
                  </span>
                  <div className={styles.profitValue}>
                    <span
                      className={
                        profitUSD >= 0
                          ? styles.profitAmountPositive
                          : styles.profitAmountNegative
                      }
                    >
                      $ {formatterUSD.format(profitUSD)}
                    </span>
                    <span
                      className={
                        profitUSD >= 0
                          ? styles.profitBsPositive
                          : styles.profitBsNegative
                      }
                    >
                      Bs {formatterBS.format(profitBS)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Análisis de Margen Visual */}
            <div className={styles.cardColumn}>
              <div>
                <span className={styles.sectionTitle}>
                  ANÁLISIS DE MARGEN VISUAL
                </span>
                <p className={styles.sectionSubtitle}>
                  Métrica corporativa del rendimiento financiero.
                </p>
              </div>
              <div className={styles.chartContainer} style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #262626)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }}
                      axisLine={{ stroke: 'var(--border-color, #333)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }}
                      axisLine={{ stroke: 'var(--border-color, #333)' }}
                      grid={{ stroke: 'var(--border-color, #262626)' }}
                    />
                    <ChartTooltip
                      contentStyle={{
                        background: 'var(--bg-card, #1c1c1c)',
                        border: '1px solid var(--border-color, #333)',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: 'var(--text-dark, #e5e5e5)' }}
                    />
                    <Bar dataKey="value" maxBarSize={24}>
                      <Cell fill="#333333" />
                      <Cell fill="var(--color-orange-red, #f97316)" />
                      <Cell fill={profitBarColor} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Stock History Chart */}
          <div className={styles.cardColumn}>
            <span className={styles.sectionTitle}>
              TENDENCIA DEL HISTORIAL DE STOCK
            </span>
            {loadingMovements ? (
              <div style={{ padding: '20px 0' }}>
                <Skeleton height={200} borderRadius={6} />
              </div>
            ) : stockChartData.length <= 1 && product.stock === 0 ? (
              <div className={styles.emptyState}>
                Sin movimientos registrados para graficar.
              </div>
            ) : (
              <div className={styles.stockChartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color, #1c1c1c)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--text-muted, #888)' }}
                      axisLine={{ stroke: 'var(--border-color, #333)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--text-muted, #888)' }}
                      axisLine={{ stroke: 'var(--border-color, #333)' }}
                      grid={{ stroke: 'var(--border-color, #1c1c1c)' }}
                    />
                    <ChartTooltip
                      contentStyle={{
                        background: 'var(--bg-card, #1c1c1c)',
                        border: '1px solid var(--border-color, #333)',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: 'var(--text-dark, #e5e5e5)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stock"
                      stroke="var(--color-orange-red, #f97316)"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#fff', stroke: 'var(--color-orange-red, #f97316)', strokeWidth: 1.5 }}
                      name="Stock"
                      animationDuration={1200}
                      animationBegin={200}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'kardex' && (
        <div className={styles.cardColumn}>
          <div className={styles.kardexHeader}>
            <span className={styles.kardexTitle}>
              Kardex Completo de Inventario
            </span>
            <p className={styles.kardexSubtitle}>
              Registro histórico de transacciones y movimientos físicos en bodega.
            </p>
          </div>

          {loadingMovements ? (
            <div style={{ marginTop: 20 }}>
              <SkeletonTable rows={4} cols={5} />
            </div>
          ) : !movements.length ? (
            <div className={styles.emptyState}>
              Sin movimientos registrados para este producto.
            </div>
          ) : (
            <div className={styles.kardexGrid}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th>Fecha</th>
                      <th>Detalle / Concepto</th>
                      <th style={{ textAlign: 'center' }}>Entrada</th>
                      <th style={{ textAlign: 'center' }}>Salida</th>
                      <th style={{ textAlign: 'right' }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {kardexRows.map((row, i) => (
                      <tr key={i}>
                        <td className={styles.dateCell}>{row.date}</td>
                        <td className={styles.descCell}>{row.description}</td>
                        <td className={row.entry ? styles.entryCell : styles.dashCell}>
                          {row.entry ? `+${row.entry}` : '—'}
                        </td>
                        <td className={row.exit ? styles.exitCell : styles.dashCell}>
                          {row.exit ? `-${row.exit}` : '—'}
                        </td>
                        <td className={styles.balanceCell}>{row.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.kardexChartCard}>
                <span className={styles.kardexChartTitle}>
                  Flujo de Movimientos
                </span>
                <div className={styles.kardexChartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kardexChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border-color, #222)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }}
                        axisLine={{ stroke: 'var(--border-color, #333)' }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }}
                        axisLine={{ stroke: 'var(--border-color, #333)' }}
                        grid={{ stroke: 'var(--border-color, #222)' }}
                      />
                      <ChartTooltip
                        contentStyle={{
                          background: 'var(--bg-card, #1c1c1c)',
                          border: '1px solid var(--border-color, #333)',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: 'var(--text-dark, #e5e5e5)' }}
                      />
                      <Bar
                        dataKey="entries"
                        name="Entradas"
                        fill="#10b981"
                        maxBarSize={12}
                      />
                      <Bar
                        dataKey="exits"
                        name="Salidas"
                        fill="#f43f5e"
                        maxBarSize={12}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
