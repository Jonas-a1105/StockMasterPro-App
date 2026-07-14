import { formatUsd } from '@shared/lib/format/currency';
import { Eye, Printer, FileText, Trash2, CreditCard, DollarSign, XCircle } from 'lucide-react';
import { DataTable } from '@features/shared-ui/DataTable';
import { Button } from '@shared/ui/Button';
import { Modal } from '@shared/ui/Modal';
import { Stack } from '@shared/ui/Stack';
import { Text } from '@shared/ui/Text';
import { printTicket } from '@shared/lib/print/ticket';
import { generateFiscalInvoicePdf } from '@shared/lib/print/invoicePdf';

interface SaleDetailModalProps {
  open: boolean;
  onClose: () => void;
  sale: any;
  onPrint: (sale: any) => void;
  onInvoicePdf: (sale: any) => void;
  onVoid: (sale: any) => void;
  formatPrice: (val: number) => string;
}

export function SaleDetailModal({
  open,
  onClose,
  sale,
  onPrint,
  onInvoicePdf,
  onVoid,
  formatPrice,
}: SaleDetailModalProps) {
  if (!open || !sale) return null;

  const subtotal = Number(sale.subtotal) || sale.items?.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 0), 0) || 0;
  const discount = Number(sale.discount) || 0;
  const tax = Number(sale.tax) || subtotal * 0.16;
  const total = Number(sale.total) || subtotal - discount + tax;

  return (
    <Modal open={open} onClose={onClose} title="Detalle de Venta" wide>
      <Stack gap="md">
        <div className="flex justifyBetween itemsStart textMd leadingRelaxed">
          <div>
            <Text><strong>Fecha:</strong> {new Date(sale.createdAt).toLocaleString()}</Text>
            <Text><strong>Cliente:</strong> {sale.customer?.name || '—'}</Text>
            <Text><strong>Método de pago:</strong> {sale.paymentMethod}</Text>
          </div>

          <div className="textRight">
            <Text variant="caption" color="muted" block>Total</Text>
            <Text variant="h2" weight="bold">{formatPrice(total)}</Text>
          </div>
        </div>

        {sale.discount && (
          <Text><strong>Descuento:</strong> {formatPrice(Number(sale.discount))}</Text>
        )}
        {sale.taxRate && (
          <Text><strong>IVA:</strong> {Number(sale.taxRate) * 100}%</Text>
        )}

        <DataTable
          data={sale.items || []}
          columns={[
            { key: 'product', header: 'Producto', render: (i: any) => i.product?.name || i.name || 'Producto' },
            { key: 'quantity', header: 'Cant', align: 'center' as const },
            { key: 'price', header: 'Precio', align: 'right' as const, render: (i: any) => formatPrice(Number(i.price)) },
            { key: 'subtotal', header: 'Subtotal', align: 'right' as const, render: (i: any) => formatPrice(Number(i.subtotal || i.total || i.price * i.quantity)) },
          ]}
          keyExtractor={(_, idx) => String(idx)}
          emptyMessage="Sin items"
          simple
        />

        <div className="flex justifyEnd gap3 pt4 borderT borderBorder">
          <Button variant="secondary" onClick={() => onPrint(sale)} disabled={sale.status === 'cancelled'}>
            <Printer size={16} /> Reimprimir Ticket
          </Button>
          <Button variant="secondary" onClick={() => onInvoicePdf(sale)} disabled={sale.status === 'cancelled'}>
            <FileText size={16} /> Factura PDF
          </Button>
          {sale.status !== 'cancelled' && (
            <Button variant="danger" onClick={() => onVoid(sale)}>
              <XCircle size={16} /> Anular Venta
            </Button>
          )}
        </div>
      </Stack>
    </Modal>
  );
}