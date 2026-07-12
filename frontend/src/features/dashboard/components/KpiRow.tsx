import { LottieIcon } from '@shared/ui/LottieIcon';
import { useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';

export function KpiRow({
  kpis,
}: {
  kpis: { key: string; cls: string; icon: any; title: string; value: any }[];
}) {
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-4">
      {kpis.map((k) => (
        <Card
          key={k.key}
          className={`flex-1 min-w-[180px] max-w-[240px] ${k.cls}`}
          onMouseEnter={() => setHoveredKpi(k.key)}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <Card.Body className="p-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `var(--kpi-color, var(--color-primary))` }}
            >
              <LottieIcon data={k.icon} size={20} play={hoveredKpi === k.key} />
            </div>
            <div className="min-w-0">
              <Text variant="label" color="muted">{k.title}</Text>
              <Text variant="h4" weight="semibold">
                {typeof k.value === 'string' && k.value.includes(' · ') ? (
                  <>
                    {k.value.split(' · ')[0]}
                    <Text variant="caption" color="muted" className="ml-1">
                      {k.value.split(' · ')[1]}
                    </Text>
                  </>
                ) : (
                  k.value
                )}
              </Text>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}