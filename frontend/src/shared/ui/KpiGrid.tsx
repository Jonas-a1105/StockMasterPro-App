import { type ReactNode, useState } from 'react';
import styles from './KpiGrid.module.css';
import { LottieIcon } from './LottieIcon';

import walletData from '@assets/lottie/wallet.json';
import creditCardData from '@assets/lottie/credit-card.json';
import shoppingBagData from '@assets/lottie/shopping-bag.json';
import analyticsData from '@assets/lottie/analytics.json';
import warningData from '@assets/lottie/warning.json';
import trendingUpData from '@assets/lottie/trending-up.json';

export interface KpiItem {
  icon?: ReactNode;
  value: string | number;
  label: string;
  color?: string;
  lottie?: 'wallet' | 'card' | 'bag' | 'analytics' | 'warning' | 'trend';
}

interface KpiGridProps {
  items: KpiItem[];
}

function getLottieData(label: string, lottieProp?: string) {
  if (lottieProp) {
    switch (lottieProp) {
      case 'wallet':
        return walletData;
      case 'card':
        return creditCardData;
      case 'bag':
        return shoppingBagData;
      case 'analytics':
        return analyticsData;
      case 'warning':
        return warningData;
      case 'trend':
        return trendingUpData;
    }
  }
  const norm = label.toLowerCase();
  if (
    norm.includes('pendiente') ||
    norm.includes('reembolsado') ||
    norm.includes('utilidad') ||
    norm.includes('ingreso') ||
    norm.includes('neto') ||
    norm.includes('caja')
  ) {
    return walletData;
  }
  if (
    norm.includes('crédito') ||
    norm.includes('gasto') ||
    norm.includes('cuenta') ||
    norm.includes('administrador') ||
    norm.includes('transacción') ||
    norm.includes('pago')
  ) {
    return creditCardData;
  }
  if (
    norm.includes('vendido') ||
    norm.includes('producto') ||
    norm.includes('almacén') ||
    norm.includes('cliente') ||
    norm.includes('usuario')
  ) {
    return shoppingBagData;
  }
  if (
    norm.includes('total') ||
    norm.includes('filtrado') ||
    norm.includes('margen') ||
    norm.includes('brecha') ||
    norm.includes('spread') ||
    norm.includes('exposición') ||
    norm.includes('tasa')
  ) {
    return analyticsData;
  }
  if (
    norm.includes('vencida') ||
    norm.includes('muerto') ||
    norm.includes('alerta') ||
    norm.includes('cero') ||
    norm.includes('bajo') ||
    norm.includes('inactivo') ||
    norm.includes('egreso') ||
    norm.includes('riesgo') ||
    norm.includes('volatilidad')
  ) {
    return warningData;
  }
  if (norm.includes('activo')) {
    return trendingUpData;
  }
  return analyticsData;
}

export function KpiGrid({ items }: KpiGridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {items.map((item, i) => {
          const lottieData = getLottieData(item.label, item.lottie);
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              className={`${styles.card} kpi-card`}
              style={
                item.color ? ({ '--kpi-color': item.color } as React.CSSProperties) : undefined
              }
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className={styles.iconWrapper}>
                <LottieIcon data={lottieData} size={22} play={isHovered} />
              </div>
              <div className={styles.content}>
                {typeof item.value === 'string' && item.value.includes(' · ') ? (
                  <>
                    <span className={styles.kpiValue}>{item.value.split(' · ')[0]}</span>
                    <span className={styles.kpiSubValue}>{item.value.split(' · ')[1]}</span>
                  </>
                ) : (
                  <span className={styles.kpiValue}>{item.value}</span>
                )}
                <span className={styles.kpiLabel}>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
