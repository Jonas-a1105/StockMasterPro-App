import { useState, useEffect } from 'react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { X } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart, Legend } from 'recharts';
import styles from './AnalyticsModal.module.css';
import { LottieIcon } from '@shared/ui/LottieIcon';
import creditCardData from '@assets/lottie/credit-card.json';
import analyticsData from '@assets/lottie/analytics.json';
import warningData from '@assets/lottie/warning.json';
import trendingUpData from '@assets/lottie/trending-up.json';

const formatterVES = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const assets = [
  { name: 'Inventarios Generales', usd: 15000 },
  { name: 'Cuentas por Cobrar Comerciales', usd: 4500 },
  { name: 'Disponibilidad de Caja Activa', usd: 1250 },
];

export function AnalyticsModal({ onClose }: { onClose: () => void }) {
  const { rate } = useExchangeRate();
  const [currentRate, setCurrentRate] = useState(rate);
  const [usdInput, setUsdInput] = useState(100);
  const [hoveredKpi, setHoveredKpi] = useState<number | null>(null);

  useEffect(() => {
    setCurrentRate(rate);
  }, [rate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const chartData = [
    { label: '28/06', tasa: 651.20, techo: 654.00, suelo: 648.00 },
    { label: '29/06', tasa: 650.60, techo: 653.50, suelo: 647.20 },
    { label: '30/06', tasa: 649.80, techo: 652.80, suelo: 646.00 },
    { label: '01/07', tasa: 655.10, techo: 658.00, suelo: 651.00 },
    { label: '02/07', tasa: 650.20, techo: 654.00, suelo: 646.50 },
    { label: '03/07 (Actual)', tasa: currentRate, techo: +(currentRate * 1.013).toFixed(2), suelo: +(currentRate * 0.987).toFixed(2) },
  ];

  const totalConverted = usdInput * currentRate;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.headerTitle}>MÓDULO DE ANALÍTICA CAMBIARIA</h1>
              <span className={styles.headerBadge}>BCV API LIVE</span>
            </div>
            <p className={styles.headerSubtitle}>
              Auditoría cambiaria, evaluación de volatilidad y estimaciones de riesgo de devaluación para el ejercicio 2026.
            </p>
          </div>
          <div className={styles.headerControls}>
            <div className={styles.rateInputGroup}>
              <span className={styles.rateInputLabel}>Tasa Base ($):</span>
              <input
                type="number"
                className={styles.rateInput}
                value={currentRate}
                onChange={e => setCurrentRate(parseFloat(e.target.value) || 0)}
                step="0.01"
              />
              <span className={styles.rateInputUnit}>VES</span>
            </div>
            <button className={styles.headerClose} onClick={onClose} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className={styles.kpiRow}>
          <div
            className={`${styles.kpiCard} ${styles.kpiCardFlex}`}
            style={{ '--kpi-color': 'var(--color-green)' }}
            onMouseEnter={() => setHoveredKpi(0)}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={analyticsData} size={22} play={hoveredKpi === 0} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Tipo de Cambio Oficial</span>
              <div className={styles.kpiValue}>
                <span className={styles.kpiValuePrefix}>Bs.</span>
                <span>{formatterVES.format(currentRate)}</span>
              </div>
              <span className={styles.kpiChange}>▲ +0.24% <span className={styles.kpiChangeSub}>Variación diaria</span></span>
            </div>
          </div>
          <div
            className={`${styles.kpiCard} ${styles.kpiCardFlex}`}
            style={{ '--kpi-color': 'var(--color-orange)' }}
            onMouseEnter={() => setHoveredKpi(1)}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={trendingUpData} size={22} play={hoveredKpi === 1} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Volatilidad Mensual (Varianza)</span>
              <div className={styles.kpiValue}>
                <span className={styles.kpiValueNum}>1.84%</span>
                <span className={styles.kpiValueTag}>Riesgo: Moderado</span>
              </div>
              <span className={styles.kpiSub}>Desviación estándar calculada a 30 días.</span>
            </div>
          </div>
          <div
            className={`${styles.kpiCard} ${styles.kpiCardFlex}`}
            style={{ '--kpi-color': 'var(--color-blue)' }}
            onMouseEnter={() => setHoveredKpi(2)}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={creditCardData} size={22} play={hoveredKpi === 2} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Brecha / Spread de Mercado</span>
              <div className={styles.kpiValue}>
                <span className={styles.kpiValueNum}>3.15%</span>
                <span className={styles.kpiValueTag}>Vs Paralelo</span>
              </div>
              <span className={styles.kpiSub}>Diferencial operativo para asignación de precios.</span>
            </div>
          </div>
          <div
            className={`${styles.kpiCard} ${styles.kpiCardFlex}`}
            style={{ '--kpi-color': 'var(--color-red)' }}
            onMouseEnter={() => setHoveredKpi(3)}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={warningData} size={22} play={hoveredKpi === 3} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Exposición de Inventario</span>
              <div className={styles.kpiValue}>
                <span className={styles.kpiValueNum}>72.4%</span>
              </div>
              <span className={styles.kpiDanger}>Porcentaje de costos dependientes de divisa.</span>
            </div>
          </div>
        </div>

        {/* Chart + Converter Row */}
        <div className={styles.row2}>
          <div className={styles.chartPanel}>
            <div className={styles.chartPanelHeader}>
              <span className={styles.chartPanelTitle}>CURVA DE TENDENCIA Y INTERVALOS DE ESTIMACIÓN</span>
              <p className={styles.chartPanelSub}>Historial acumulado y bandas estadísticas predictivas (Techo/Suelo) para los próximos periodos.</p>
            </div>
            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="#222" strokeDasharray="2 2" />
                  <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `Bs. ${v.toFixed(1)}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #333', borderRadius: 0, fontSize: 12 }}
                    labelStyle={{ color: '#aaa' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#aaa' }} />
                  <Area type="monotone" dataKey="suelo" stroke="#3b82f6" strokeWidth={1.2} strokeDasharray="4 4" fill="transparent" dot={false} name="Suelo Estimado (Soporte)" />
                  <Area type="monotone" dataKey="tasa" stroke="#10b981" strokeWidth={2.5} fill="rgba(16, 185, 129, 0.03)" dot={{ fill: '#fff', r: 3 }} name="Tasa Efectiva BCV" />
                  <Area type="monotone" dataKey="techo" stroke="#ef4444" strokeWidth={1.2} strokeDasharray="4 4" fill="transparent" dot={false} name="Techo Estimado (Resistencia)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.converterPanel}>
            <div className={styles.converterTitle}>CONVERSOR MATRICIAL POS</div>
            <div className={styles.converterBox}>
              <div className={styles.converterInputGroup}>
                <label className={styles.converterLabel}>Entrada Base (USD $)</label>
                <input
                  type="number"
                  className={styles.converterInput}
                  value={usdInput}
                  onChange={e => setUsdInput(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className={styles.converterDivider} />
              <div>
                <label className={styles.converterLabelResult}>Contravalor Cambiario (VES Bs.)</label>
                <div className={styles.converterResult}>{formatterVES.format(totalConverted)} Bs.</div>
              </div>
            </div>

            <div className={styles.arbitrageBox}>
              <span className={styles.arbitrageTitle}>Márgenes de Resguardo POS</span>
              <div className={styles.arbitrageRow}>
                <span>Precio de Compra (+2%):</span>
                <span className={styles.arbitrageValue}>Bs. {formatterVES.format(currentRate * 1.02)}</span>
              </div>
              <div className={styles.arbitrageRow}>
                <span>Precio de Protección (+5%):</span>
                <span className={styles.arbitrageValue}>Bs. {formatterVES.format(currentRate * 1.05)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Projections + Asset Indexation */}
        <div className={styles.row3}>
          <div className={styles.projectionPanel}>
            <div className={styles.projectionTitle}>INDICADOR DE PROYECCIÓN DE TENDENCIA</div>
            <p className={styles.projectionSub}>Cálculo de probabilidad matemática para el próximo cierre de tasas.</p>
            <div className={styles.projectionBars}>
              <div className={styles.projectionBarGroup}>
                <div className={styles.projectionBarLabel}>
                  <span className={styles.projectionBarText}>Probabilidad de Alza (Riesgo Almofada)</span>
                  <span className={styles.projectionBarPctRed}>74.2%</span>
                </div>
                <div className={styles.projectionBarTrack}>
                  <div className={`${styles.projectionBarRed} ${styles.progress74}`} />
                </div>
              </div>
              <div className={styles.projectionBarGroup}>
                <div className={styles.projectionBarLabel}>
                  <span className={styles.projectionBarText}>Probabilidad de Estabilidad o Baja</span>
                  <span className={styles.projectionBarPctGreen}>25.8%</span>
                </div>
                <div className={styles.projectionBarTrack}>
                  <div className={`${styles.projectionBarGreen} ${styles.progress25}`} />
                </div>
              </div>
            </div>
            <div className={styles.supportResistance}>
              <div className={styles.supportCard}>
                <span className={styles.supportLabel}>Resistencia Techo (R1)</span>
                <span className={styles.supportValueRed}>Bs. {formatterVES.format(currentRate * 1.013)}</span>
              </div>
              <div className={styles.supportCard}>
                <span className={styles.supportLabel}>Soporte Suelo (S1)</span>
                <span className={styles.supportValueGreen}>Bs. {formatterVES.format(currentRate * 0.987)}</span>
              </div>
            </div>
          </div>

          <div className={styles.indexPanel}>
            <div className={styles.indexTitle}>VALORACIÓN PATRIMONIAL INDEXADA</div>
            <p className={styles.indexSub}>Revaluación patrimonial automática de activos circulantes basada en la tasa de cambio simulada.</p>
            <div className={styles.indexTable}>
              <div className={styles.indexTableHeader}>
                <span className={styles.indexColAsset}>Activo Financiero</span>
                <span className={styles.indexColUsd}>Valor base (USD)</span>
                <span className={styles.indexColVesInit}>Valor Inicial (VES)</span>
                <span className={styles.indexColVesReval}>Valor Revaluado (VES)</span>
              </div>
              {assets.map(a => {
                const initialVes = a.usd * currentRate;
                return (
                  <div key={a.name} className={styles.indexTableRow}>
                    <span className={styles.indexColAsset}>{a.name}</span>
                    <span className={styles.indexColUsd}>$ {formatterVES.format(a.usd)}</span>
                    <span className={styles.indexColVesInit}>Bs. {formatterVES.format(initialVes)}</span>
                    <span className={styles.indexColVesReval}>Bs. {formatterVES.format(initialVes)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
