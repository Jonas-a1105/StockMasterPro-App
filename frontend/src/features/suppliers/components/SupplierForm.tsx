import { useState } from 'react';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { PremiumLockButton } from '@shared/ui/PremiumLockButton';
import styles from '@features/inventory/pages/InventoryPage.module.css';

interface SupplierFormData {
  name: string; contact: string; phone: string; email: string; address: string;
}

export function SupplierForm({
  open, editingId, initialData, onClose, onSubmit, loading, isLimitExceeded, nextRequiredPlan,
}: {
  open: boolean; editingId: string | null; initialData: SupplierFormData;
  onClose: () => void; onSubmit: (data: SupplierFormData) => Promise<void>;
  loading: boolean; isLimitExceeded: boolean; nextRequiredPlan: string;
}) {
  const [form, setForm] = useState<SupplierFormData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Nombre *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Nombre del proveedor" />
          </div>
          <div className={styles.field}>
            <label>Contacto</label>
            <input type="text" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Persona de contacto" />
          </div>
          <div className={styles.field}>
            <label>Teléfono / WhatsApp</label>
            <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+58 4XX XXX XXXX" />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="correo@gmail.com" />
          </div>
          <div className={styles.fieldFull}>
            <label>Dirección</label>
            <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Dirección del proveedor" />
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          {isLimitExceeded ? (
            <PremiumLockButton requiredPlan={nextRequiredPlan as any} width="140px" height="38px" label="Límite Superado" sublabel="Mantén pulsado para ampliar" />
          ) : (
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? <ButtonLoader /> : 'Guardar'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
