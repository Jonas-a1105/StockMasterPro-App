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
    <Card className="minH0">
      <Card.Header>
        <Card.Title>Calendario de eventos</Card.Title>
      </Card.Header>
      <Card.Body className="p0">
        <div className="flex gap0">
          <div className="w-2-5 p4 borderR flex flexCol">
            <Text variant="h1" weight="bold" color="danger" lineHeight="1">
              {today.getDate()}
            </Text>
            <Text variant="body" weight="semibold" className="mt1">
              {today.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
            </Text>
            <Text variant="caption" color="muted" className="mt2 mb4">
              {today.toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}{' '}
              • {lowStockProducts.length + todaySales.length} Eventos
            </Text>
            <div className="flex itemsEnd justifyBetween mtAuto">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => {
                const dayNum = today.getDate() - today.getDay() + i;
                const isToday = dayNum === today.getDate();
                return (
                  <div key={i} className="flex flexCol itemsCenter gap1 textXs">
                    <span className={isToday ? 'textText' : 'textMuted opacity50'}>{dayNum}</span>
                    <span
                      className={isToday ? 'bgBg textText roundedFull flex itemsCenter justifyCenter fontSemibold' : ''}
                      style={isToday ? { width: '20px', height: '20px' } : undefined}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-3-5 p4 flex flexCol gap2 overflowYAuto" style={{ maxHeight: '160px' }}>
            {!hasEvents ? (
              <Text variant="caption" color="muted" className="p4 textCenter">
                No hay eventos registrados hoy.
              </Text>
            ) : (
              <>
                {todaySales.slice(0, 3).map((s, i) => (
                  <div key={`s-${i}`} className="pl3 textNoWrap" style={{ '--list-item-color': '#22c55e' }}>
                    <Text variant="caption" weight="medium" color="text" className="mb1">
                      Venta {s.invoiceNumber ? `#${s.invoiceNumber}` : ''}
                    </Text>
                    <Text variant="caption" color="muted">
                      ${(s.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &bull; {s.paymentMethod || 'Caja Central'}
                    </Text>
                  </div>
                ))}
                {lowStockProducts.slice(0, 2).map((p, i) => (
                  <div key={`l-${i}`} className="pl3 textNoWrap" style={{ '--list-item-color': '#f97316' }}>
                    <Text variant="caption" weight="medium" color="primary" className="mb1">
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