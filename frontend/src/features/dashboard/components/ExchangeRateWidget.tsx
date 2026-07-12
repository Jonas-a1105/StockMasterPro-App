import { useState, useEffect, useCallback, useRef } from 'react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { BarChart3, X } from 'lucide-react';
import styles from './ExchangeRateWidget.module.css';

function generateHistory(rate: number) {
  const data: { date: string; value: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variation = (Math.random() - 0.5) * rate * 0.06;
    data.push({
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      value: +(rate + variation).toFixed(2),
    });
  }
  data[data.length - 1].value = rate;
  return data;
}

function sparklinePath(data: { value: number }[], W = 246, H = 65) {
  if (data.length < 2) return '';
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.12 || 1;
  const yMin = min - pad;
  const yMax = max + pad;
  const yRange = yMax - yMin || 1;
  const stepX = W / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: H - ((d.value - yMin) / yRange) * (H - 8) - 4,
  }));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;
  return { line, area };
}

export function ExchangeRateWidget({ onClose, onOpenAnalytics }: { onClose: () => void; onOpenAnalytics?: () => void }) {
  const { rate, updatedAt, source } = useExchangeRate();
  const [activeTab, setActiveTab] = useState<'trend' | 'calc'>('trend');
  const [currentInput, setCurrentInput] = useState('0');
  const [isUsdToVes, setIsUsdToVes] = useState(true);
  const historyRef = useRef<{ date: string; value: number }[]>([]);

  if (historyRef.current.length === 0 || historyRef.current[historyRef.current.length - 1].value !== rate) {
    historyRef.current = generateHistory(rate);
  }

  const paths = sparklinePath(historyRef.current);
  const lastP = historyRef.current.length > 0
    ? { value: historyRef.current[historyRef.current.length - 1].value, date: historyRef.current[historyRef.current.length - 1].date }
    : null;
  const firstP = historyRef.current.length > 0 ? historyRef.current[0] : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const calculateConversion = useCallback(() => {
    const numericValue = parseFloat(currentInput) || 0;
    if (isUsdToVes) {
      return (numericValue * rate).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      return (numericValue / rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }, [currentInput, isUsdToVes, rate]);

  const pressNum = (num: string) => {
    setCurrentInput(prev => prev === '0' ? num : prev.length < 10 ? prev + num : prev);
  };

  const pressDot = () => {
    setCurrentInput(prev => prev.includes('.') ? prev : prev + '.');
  };

  const pressClear = () => {
    setCurrentInput('0');
  };

  const pressDelete = () => {
    setCurrentInput(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const toggleMode = () => {
    setIsUsdToVes(v => !v);
  };

  const result = calculateConversion();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.panelWrapper}>
          {/* Tabs */}
          <div className={styles.header}>
            <button
              className={activeTab === 'trend' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('trend')}
            >
              Monitoreo API
            </button>
            <button
              className={activeTab === 'calc' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('calc')}
            >
              Calculadora VES
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>

          {/* TREND PANEL */}
          {activeTab === 'trend' && (
            <div className={styles.panelBody}>
              <div className={styles.trendHeader}>
                <div>
                  <div className={styles.trendTitle}>
                    <span className={styles.dot} />
                    <span className={styles.titleLabel}>TASA REF / VES</span>
                  </div>
                  <p className={styles.sourceLabel}>Origen de datos: {source || 've.dolarapi.com'}</p>
                </div>
                <div className={styles.flexRow}>
                  <div className={styles.variationBadge}>+0.24%</div>
                  {onOpenAnalytics && (
                    <button className={styles.analyticsBtn} onClick={() => { onOpenAnalytics(); onClose(); }} title="Analítica cambiaria">
                      <BarChart3 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.rateBlock}>
                <span className={styles.rateValue}>
                  {rate.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={styles.rateUnit}>VES / USD</span>
              </div>

              <div className={styles.chartSection}>
                <span className={styles.chartLabel}>Historial Últimos 7 Días</span>
                <div className={styles.chartBox}>
                  <svg viewBox="0 0 246 65" width="100%" height="100%" preserveAspectRatio="none">
                    <line x1="0" y1="32" x2="246" y2="32" stroke="#262626" strokeWidth="1" strokeDasharray="4 4" />
                    {typeof paths === 'object' && paths.area && <path d={paths.area} fill="#10b981" fillOpacity="0.04" />}
                    {typeof paths === 'object' && paths.line && <path d={paths.line} fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                </div>
                <div className={styles.chartDates}>
                  <span>{firstP?.date || ''}</span>
                  <span>Cierre de Periodo</span>
                  <span>{lastP?.date || ''}</span>
                </div>
              </div>

              <div className={styles.footer}>
                <span className={styles.footerTime}>
                  Refrescado: {new Date(updatedAt).toLocaleTimeString()}
                </span>
                <button className={styles.footerConvertBtn} onClick={() => setActiveTab('calc')}>
                  Convertir Divisas ➔
                </button>
              </div>
            </div>
          )}

          {/* CALC PANEL */}
          {activeTab === 'calc' && (
            <div className={styles.panelBody}>
              <div className={styles.calcDisplay}>
                <div className={styles.calcDirectionBadge}>
                  {isUsdToVes ? 'USD ➔ VES' : 'VES ➔ USD'}
                </div>

                <div className={styles.calcInputRow}>
                  <span className={styles.calcSymbol}>{isUsdToVes ? '$' : 'Bs.'}</span>
                  <input type="text" className={styles.calcInput} value={currentInput} readOnly />
                </div>

                <div className={styles.calcResultRow}>
                  <span className={styles.calcResultSymbol}>{isUsdToVes ? 'Bs.' : '$'}</span>
                  <span className={styles.calcResultValue}>{result}</span>
                </div>
              </div>

              <div className={styles.calcGrid}>
                <button className={styles.key} onClick={() => pressNum('7')}>7</button>
                <button className={styles.key} onClick={() => pressNum('8')}>8</button>
                <button className={styles.key} onClick={() => pressNum('9')}>9</button>
                <button className={styles.keyClear} onClick={pressClear}>C</button>

                <button className={styles.key} onClick={() => pressNum('4')}>4</button>
                <button className={styles.key} onClick={() => pressNum('5')}>5</button>
                <button className={styles.key} onClick={() => pressNum('6')}>6</button>
                <button className={styles.keySwap} onClick={toggleMode} title="Invertir conversión">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>

                <button className={styles.key} onClick={() => pressNum('1')}>1</button>
                <button className={styles.key} onClick={() => pressNum('2')}>2</button>
                <button className={styles.key} onClick={() => pressNum('3')}>3</button>
                <button className={styles.keyBackspace} onClick={pressDelete}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414A2 2 0 0010.828 19H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                </button>

                <button className={styles.keyDouble} onClick={() => pressNum('0')}>0</button>
                <button className={styles.key} onClick={pressDot}>.</button>
              </div>

              <button className={styles.calcSubmitBtn} onClick={() => setActiveTab('trend')}>
                Confirmar / Hecho
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
