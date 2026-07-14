import { type ReactNode, useState } from 'react';
import { LottieIcon } from '@shared/ui/LottieIcon';
import { Stack, Card, Flex, Text } from '@shared/ui';
import styles from './KpiGrid.module.css';

export interface KpiItem {
  icon?: ReactNode;
  value: string | number;
  label: string;
  color?: string;
  lottie?: Record<string, unknown>;
}

interface KpiGridProps {
  items: KpiItem[];
}

export function KpiGrid({ items }: KpiGridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <Stack direction="row" gap="md" wrap className={styles.container}>
        {items.map((item, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <Card
              key={i}
              className={`${styles.card} kpi-card`}
              style={item.color ? { '--kpi-color': item.color } as React.CSSProperties : undefined}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              padding="md"
            >
              <Flex align="center" justify="center" className={styles.iconWrapper} style={{ width: 42, height: 42, borderRadius: 'var(--btn-radius)' }}>
                {item.lottie ? (
                  <LottieIcon data={item.lottie} size={22} play={isHovered} />
                ) : item.icon ? (
                  item.icon
                ) : null}
              </Flex>
              <Stack gap="xs" className={styles.content} style={{ minWidth: 0 }}>
                {typeof item.value === 'string' && item.value.includes(' · ') ? (
                  <>
                    <Text variant="body" weight="bold" className={styles.kpiValue}>{item.value.split(' · ')[0]}</Text>
                    <Text variant="caption" color="muted" className={styles.kpiSubValue}>{item.value.split(' · ')[1]}</Text>
                  </>
                ) : (
                  <Text variant="body" weight="bold" className={styles.kpiValue}>{item.value}</Text>
                )}
                <Text variant="caption" weight="semibold" color="muted" className={styles.kpiLabel}>{item.label}</Text>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </div>
  );
}