import { useState } from 'react';
import { Modal, Button, FormField, Input, ButtonLoader } from '@shared/ui';
import { PremiumLockButton } from '@features/billing/components/PremiumLockButton';

export interface SupplierFormData {
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  fiscalAddress: string;
}

export function SupplierForm({
  open,
  editingId,
  initialData,
  onClose,
  onSubmit,
  loading,
  isLimitExceeded,
  nextRequiredPlan,
}: {
  open: boolean;
  editingId: string | null;
  initialData: SupplierFormData;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  loading: boolean;
  isLimitExceeded: boolean;
  nextRequiredPlan: string;
}) {
  const [form, setForm] = useState<SupplierFormData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Nombre" required>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              placeholder="Nombre del proveedor"
            />
          </FormField>
          <FormField label="Contacto">
            <Input
              type="text"
              value={form.contact}
              onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
              placeholder="Persona de contacto"
            />
          </FormField>
          <FormField label="Teléfono / WhatsApp">
            <Input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+58 4XX XXX XXXX"
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="correo@gmail.com"
            />
          </FormField>
          <FormField label="RIF">
            <Input
              type="text"
              value={form.taxId}
              onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))}
              placeholder="J-12345678-9"
            />
          </FormField>
          <FormField label="Dirección">
            <Input
              type="text"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Dirección del proveedor"
            />
          </FormField>
          <FormField label="Dirección Fiscal" className="md:col-span-2">
            <Input
              type="text"
              value={form.fiscalAddress}
              onChange={(e) => setForm((p) => ({ ...p, fiscalAddress: e.target.value }))}
              placeholder="Dirección fiscal"
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
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
            <Button type="submit" disabled={loading}>
              {loading ? <ButtonLoader /> : 'Guardar'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
