import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FormField } from '@shared/ui/FormField';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { Button } from '@shared/ui/Button';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { PremiumLockButton } from '@features/billing/components/PremiumLockButton';
import { Modal } from '@shared/ui/Modal';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  documentType: string;
  fiscalAddress: string;
  creditLimit: number;
}

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  editingCustomer: any | null;
  initialData: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  saving: boolean;
  error?: string;
  isLimitExceeded: boolean;
  nextRequiredPlan: string;
}

export function CustomerForm({
  open,
  onClose,
  editingCustomer,
  initialData,
  onSubmit,
  saving,
  error,
  isLimitExceeded,
  nextRequiredPlan,
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormData>(initialData);

  useEffect(() => {
    if (open) {
      setForm(initialData);
    }
  }, [open, initialData]);

  const handleChange = (field: keyof CustomerFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'} wide>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Nombre *" required>
            <Input
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="email@ejemplo.com"
            />
          </FormField>

          <FormField label="Teléfono">
            <Input
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="+58 4XX XXX XXXX"
            />
          </FormField>

          <FormField label="Dirección" className="md:col-span-2">
            <Input
              value={form.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Dirección de entrega"
            />
          </FormField>

          <FormField label="RIF / Cédula" className="md:col-span-2">
            <div className="flex gap-2">
              <Select
                value={form.documentType}
                onChange={v => handleChange('documentType', v)}
                options={[
                  { value: 'V', label: 'V' },
                  { value: 'J', label: 'J' },
                  { value: 'E', label: 'E' },
                  { value: 'G', label: 'G' },
                ]}
                className="w-20"
              />
              <Input
                value={form.taxId}
                onChange={e => handleChange('taxId', e.target.value)}
                placeholder="12345678-9"
                className="flex-1"
              />
            </div>
          </FormField>

          <FormField label="Dirección Fiscal" className="md:col-span-3">
            <Input
              value={form.fiscalAddress}
              onChange={e => handleChange('fiscalAddress', e.target.value)}
              placeholder="Dirección fiscal completa"
            />
          </FormField>

          <FormField label="Límite de Crédito ($)">
            <Input
              type="number"
              step="0.01"
              value={form.creditLimit || ''}
              onChange={e => handleChange('creditLimit', Number(e.target.value) || 0)}
              placeholder="0.00"
            />
          </FormField>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-danger/10 text-danger rounded-lg text-sm">{error}</div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          {isLimitExceeded ? (
            <PremiumLockButton
              requiredPlan={nextRequiredPlan as any}
              width="140px"
              height="38px"
              label="Límite Superado"
              sublabel="Mantén pulsado para ampliar"
            />
          ) : (
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {saving ? <ButtonLoader /> : 'Guardar'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}