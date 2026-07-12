import { Card } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';

export function EventsCalendar({
  todaySales,
  lowStockProducts,
}: {
  todaySales: any[];
  lowStockProducts: any[];
}) {
  const hasEvents = todaySales.length > 0 || lowStockProducts.length > 0;
  const today = new Date();

  return (
    <Card className="min-h-0">
      <Card.Header>
        <Card.Title>Calendario de eventos</Card.Title>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="flex gap-0">
          <div className="w-2/5 p-4 border-r flex flex-col">
            <Text variant="h1" weight="bold" color="danger" lineHeight="1">
              {today.getDate()}
            </Text>
            <Text variant="body" weight="semibold" className="mt-1">
              {today.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
            </Text>
            <Text variant="caption" color="muted" className="mt-2 mb-4">
              {today.toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}{' '}
              • {lowStockProducts.length + todaySales.length} Eventos
            </Text>
            <div className="flex items-end justify-between mt-auto">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => {
                const dayNum = today.getDate() - today.getDay() + i;
                const isToday = dayNum === today.getDate();
                return (
                  <div key={i} className="flex flex-col items-center gap-1 text-xs">
                    <span className={isToday ? 'text-text' : 'text-text-muted opacity-50'}>{dayNum}</span>
                    <span className={isToday ? 'bg-surface text-text rounded-full w-5 h-5 flex items-center justify-center font-semibold' : ''}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-3/5 p-4 flex flex-col gap-2 overflow-y-auto max-h-[160px]">
            {!hasEvents ? (
              <Text variant="caption" color="muted" className="p-4 text-center">
                No hay eventos registrados hoy.
              </Text>
            ) : (
              <>
                {todaySales.slice(0, 3).map((s, i) => (
                  <div key={`s-${i}`} className="pl-3.5 whitespace-nowrap" style={{ '--list-item-color': '#22c55e' }}>
                    <Text variant="caption" weight="medium" color="text" className="mb-1">
                      Venta {s.invoiceNumber ? `#${s.invoiceNumber}` : ''}
                    </Text>
                    <Text variant="caption" color="muted">
                      ${(s.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &bull; {s.paymentMethod || 'Caja Central'}
                    </Text>
                  </div>
                ))}
                {lowStockProducts.slice(0, 2).map((p, i) => (
                  <div key={`l-${i}`} className="pl-3.5 whitespace-nowrap" style={{ '--list-item-color': '#f97316' }}>
                    <Text variant="caption" weight="medium" color="primary" className="mb-1">
                      Stock Bajo: {p.name}
                    </Text>
                    <Text variant="caption" color="muted">
                      {p.stock} / {p.minStock} unidades
                    </Text>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}