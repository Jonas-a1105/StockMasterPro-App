import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Package } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Card, Input, Skeleton, SkeletonTable, Button, Text, Heading } from '@shared/ui';
import { DataTable } from '@shared/ui';
import type { Product, InventoryMovement } from '@types';
import styles from './ProductDetailPanel.module.css';

interface ProductDetailPanelProps {
  product: Product;
  movements: InventoryMovement[];
  loadingMovements: boolean;
  getCategoryName: (id: string | null) => string;
}

export function ProductDetailPanel({
  product,
  movements,
  loadingMovements,
  getCategoryName,
}: ProductDetailPanelProps) {
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
      const desc = m.notes || (m.reference ? `${m.reference}` : '') || m.type || 'Movimiento';
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

  const kardexColumns = useMemo(() => [
    { key: 'date', header: 'Fecha' },
    { key: 'description', header: 'Detalle / Concepto' },
    { key: 'entry', header: 'Entrada', align: 'center' as const, render: (row: any) =>
      row.entry ? <Text weight="bold" color="success">+{row.entry}</Text> : <Text color="muted">—</Text>
    },
    { key: 'exit', header: 'Salida', align: 'center' as const, render: (row: any) =>
      row.exit ? <Text weight="bold" color="danger">-{row.exit}</Text> : <Text color="muted">—</Text>
    },
    { key: 'balance', header: 'Saldo', align: 'right' as const, render: (row: any) =>
      <Text weight="bold">{row.balance}</Text>
    },
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className={styles.tabbar}>
        <Button
          variant="ghost"
          className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('general')}
        >
          VISTA GENERAL
        </Button>
        <Button
          variant="ghost"
          className={`${styles.tab} ${activeTab === 'kardex' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('kardex')}
        >
          KARDEX DE INVENTARIO
        </Button>
      </div>

      {activeTab === 'general' && (
        <div className="flex flex-col gap-4">
          <div className={styles.grid3}>
            {/* Columna Identidad Producto */}
            <div className={styles.flexColumnGap16}>
              <Card>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className={styles.image} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <Package size={40} />
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex flex-col gap-3">
                  <div>
                    <Text variant="caption" color="muted" weight="semibold" className="block mb-0.5">NOMBRE</Text>
                    <Heading variant="h2" className="block">{product.name}</Heading>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Text variant="caption" color="muted" weight="semibold" className="block mb-0.5">MARCA</Text>
                      <Text variant="body-sm" weight="semibold" className="block">{product.brand || '—'}</Text>
                    </div>
                    <div>
                      <Text variant="caption" color="muted" weight="semibold" className="block mb-0.5">CATEGORÍA</Text>
                      <Text variant="body-sm" weight="semibold" className="block">{getCategoryName(product.categoryId)}</Text>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Text variant="caption" color="muted" weight="semibold" className="block mb-0.5">CÓDIGO DE BARRAS</Text>
                      <Text variant="body-sm" weight="semibold" color="primary" className="font-mono block">{product.barcode || '—'}</Text>
                    </div>
                    <div>
                      <Text variant="caption" color="muted" weight="semibold" className="block mb-0.5">STOCK ACTUAL</Text>
                      <Text variant="body-sm" weight="semibold" className="block">
                        {product.stock}{' '}
                        <Text variant="caption" color="primary">(mín: {product.minStock})</Text>
                      </Text>
                    </div>
                  </div>
                  {product.description && (
                    <div className="p-3 bg-bg rounded-lg flex flex-col gap-1.5">
                      <Text variant="caption" color="muted" weight="semibold" className="block mb-0.5">DESCRIPCIÓN</Text>
                      <Text variant="caption" color="muted" className="italic block">{product.description}</Text>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Columna Control Referencia & API */}
            <Card>
              <div className="flex flex-col gap-3">
                <div>
                  <Heading variant="h3" className="block mb-2">CONTROL DE REFERENCIA & API</Heading>
                  <div className={styles.apiGrid}>
                    <div className="p-3 bg-bg rounded-lg flex flex-col gap-1.5">
                      <Text as="label" variant="label" color="muted" weight="semibold" className="block mb-0.5">TASA API (Bs/$)</Text>
                      <Input
                        type="number"
                        value={apiRate}
                        onChange={(e) => setApiRate(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="p-3 bg-bg rounded-lg flex flex-col gap-1.5">
                      <Text as="label" variant="label" color="muted" weight="semibold" className="block mb-0.5">REF. VENTA ($)</Text>
                      <Input
                        type="number"
                        value={refPrice}
                        step="0.1"
                        onChange={(e) => setRefPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-bg rounded-lg flex flex-col gap-1.5">
                  <div className={styles.financialRow}>
                    <Text color="muted" variant="caption">Costo Base:</Text>
                    <Text variant="caption" weight="semibold">
                      {formatUsd(costUSD)}{' '}
                      <Text variant="caption" color="muted">
                        / {formatBs(costUSD * apiRate)}
                      </Text>
                    </Text>
                  </div>
                  <div className="w-full border-t border-border my-1.5" />
                  <div className={styles.financialRow}>
                    <Text color="muted" variant="caption">Precio Venta Estimado:</Text>
                    <Text variant="caption" weight="semibold">
                      {formatUsd(refPrice)}{' '}
                      <Text variant="caption" color="muted">/ {formatBs(saleBS)}</Text>
                    </Text>
                  </div>
                  <div className="w-full border-t border-border my-1.5 opacity-50" />
                  <div className={styles.financialRow}>
                    <Text weight="semibold" variant="caption" className="tracking-wider">GANANCIA ESTIMADA:</Text>
                    <div className="text-right flex flex-col">
                      <Text
                        weight="bold"
                        color={profitUSD >= 0 ? 'success' : 'danger'}
                        className="text-md"
                      >
                        {formatUsd(profitUSD)}
                      </Text>
                      <Text
                        variant="caption"
                        color={profitUSD >= 0 ? 'success' : 'danger'}
                      >
                        {formatBs(profitBS)}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Columna Análisis de Margen Visual */}
            <Card>
              <div className="flex flex-col gap-3">
                <div>
                  <Heading variant="h3" className="block mb-2">ANÁLISIS DE MARGEN VISUAL</Heading>
                  <Text variant="caption" color="muted" className="block mb-2">
                    Métrica corporativa del rendimiento financiero.
                  </Text>
                </div>
                <div className={`${styles.chartContainer} ${styles.flex1}`}>
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
            </Card>
          </div>

          {/* Stock History Chart */}
          <Card>
            <div className="flex flex-col gap-3">
              <Heading variant="h3" className="block mb-2">TENDENCIA DEL HISTORIAL DE STOCK</Heading>
              {loadingMovements ? (
                <div className={styles.padding20Y}>
                  <Skeleton height={200} borderRadius={6} />
                </div>
              ) : stockChartData.length <= 1 && product.stock === 0 ? (
                <div className={styles.emptyState}><Text color="muted">Sin movimientos registrados para graficar.</Text></div>
              ) : (
                <div className={styles.stockChartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #1c1c1c)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'var(--text-muted, #888)' }}
                        axisLine={{ stroke: 'var(--border-color, #333)' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'var(--text-muted, #888)' }}
                        axisLine={{ stroke: 'var(--border-color, #333)' }}
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
                        dot={{
                          r: 3.5,
                          fill: '#fff',
                          stroke: 'var(--color-orange-red, #f97316)',
                          strokeWidth: 1.5,
                        }}
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
          </Card>
        </div>
      )}

      {activeTab === 'kardex' && (
        <Card>
          <div className="flex flex-col gap-3">
            <div className={styles.kardexHeader}>
              <Heading variant="h3" className="block mb-2">Kardex Completo de Inventario</Heading>
              <Text variant="caption" color="muted" className="block mb-2">
                Registro histórico de transacciones y movimientos físicos en bodega.
              </Text>
            </div>

            {loadingMovements ? (
              <div className={styles.marginTop20}>
                <SkeletonTable rows={4} cols={5} />
              </div>
            ) : !movements.length ? (
              <div className={styles.emptyState}><Text color="muted">Sin movimientos registrados para este producto.</Text></div>
            ) : (
              <div className={styles.kardexGrid}>
                <div className={styles.tableWrapper}>
                  <DataTable
                    data={kardexRows}
                    columns={kardexColumns}
                    keyExtractor={(_, i) => String(i)}
                    searchable={false}
                    sortable={false}
                  />
                </div>

                <div className={styles.kardexChartCard}>
                  <Text variant="caption" color="muted" weight="semibold" className="block mb-1">Flujo de Movimientos</Text>
                  <div className={styles.kardexChartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kardexChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #222)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }}
                          axisLine={{ stroke: 'var(--border-color, #333)' }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }}
                          axisLine={{ stroke: 'var(--border-color, #333)' }}
                        />
                        <ChartTooltip
                          contentStyle={{
                            background: 'var(--bg-card, #1c1c1c)',
                            border: '1px solid var(--border-color, #333)',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: 'var(--text-dark, #e5e5e5)' }}
                        />
                        <Bar dataKey="entries" name="Entradas" fill="#10b981" maxBarSize={12} />
                        <Bar dataKey="exits" name="Salidas" fill="#f43f5e" maxBarSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
