import { useState } from 'react';
import { DollarSign, CreditCard, Banknote } from 'lucide-react';
import { FormField } from '@shared/ui/FormField';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { Button } from '@shared/ui/Button';
import { Modal } from '@shared/ui/Modal';
import { formatUsd } from '@shared/lib/format/currency';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  customer: any;
  onPay: (amount: number, method: 'cash' | 'card' | 'transfer') => Promise<void>;
  loading: boolean;
}

export function PaymentModal({ open, onClose, customer, onPay, loading }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [error, setError] = useState('');

  const handlePay = async () => {
    const val = Number(amount);
    if (!val || val <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (val > customer.balance) {
      setError('El monto no puede exceder el saldo pendiente');
      return;
    }
    setError('');
    try {
      await onPay(val, method);
    } catch (e: any) {
      setError(e.message || 'Error al registrar pago');
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Registrar Abono" narrow>
      <div className="space-y-4">
        <div className="bg-surface-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <DollarSign size={16} />
            <span>Saldo pendiente: <strong className="text-text text-lg">{formatUsd(customer.balance)}</strong></span>
          </div>
        </div>

        <FormField label="Monto a abonar *">
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="0.00"
            className={error ? 'border-danger' : ''}
          />
          {error && <span className="text-danger text-sm">{error}</span>}
        </FormField>

        <FormField label="Método de pago *">
          <Select
            value={method}
            onChange={setMethod}
            options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
            ]}
            icons={{
              cash: <Banknote size={18} />,
              card: <CreditCard size={18} />,
              transfer: <DollarSign size={18} />,
            }}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handlePay} loading={loading}>
            Confirmar abono
          </Button>
        </div>
      </div>
    </Modal>
  );
}