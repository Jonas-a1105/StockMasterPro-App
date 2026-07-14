import { Card } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';

export function RecentActivity({
  activities,
}: {
  activities: { title: string; desc: string; time: string; color: string }[];
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Actividad reciente del sistema</Card.Title>
      </Card.Header>
      <Card.Body>
        {activities.length === 0 ? (
          <Text variant="description">No hay actividad reciente.</Text>
        ) : (
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-4">
            {activities.map((act, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 p-2 bg-surface rounded-lg border border-border"
              >
                <div>
                  <Text
                    variant="bodySm"
                    weight="semibold"
                    style={{ color: act.color === '#22c55e' ? 'var(--color-text)' : 'var(--color-primary)' }}
                  >
                    {act.title}
                  </Text>
                  <Text variant="caption" className="mt-1">
                    {act.desc}
                  </Text>
                </div>
                <Text variant="caption" className="whitespace-nowrap ml-4">
                  {act.time}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
