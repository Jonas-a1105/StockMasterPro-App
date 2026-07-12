import { Edit2, Trash2, MessageCircle } from 'lucide-react';
import type { Supplier } from '@types';
import styles from './SuppliersList.module.css';

export function SuppliersList({
  suppliers, userRole, onEdit, onDelete, onWhatsApp,
}: {
  suppliers: Supplier[]; userRole?: string;
  onEdit: (s: Supplier) => void; onDelete: (id: string) => void; onWhatsApp: (phone: string, name: string) => void;
}) {
  return (
    <div className="lista-container">
      <table className="lista-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Email</th>
            {userRole !== 'cajero' && <th className={styles.textCenter}>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {suppliers.map(supplier => (
            <tr key={supplier.id}>
              <td><span className="lista-name-text">{supplier.name}</span></td>
              <td className={styles.textMuted}>{supplier.contact || '—'}</td>
              <td>{supplier.phone || '—'}</td>
              <td>{supplier.email || '—'}</td>
              {userRole !== 'cajero' && (
                <td className={styles.textCenter}>
                  <div className="lista-actions">
                    {supplier.phone && (
                      <button className="lista-action-btn" onClick={() => onWhatsApp(supplier.phone!, supplier.name)} title="Enviar WhatsApp">
                        <MessageCircle size={14} />
                      </button>
                    )}
                    <button className="lista-action-btn" onClick={() => onEdit(supplier)} title="Editar"><Edit2 size={14} /></button>
                    <button className="lista-action-btn danger" onClick={() => onDelete(supplier.id)} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {suppliers.length === 0 && <p className={styles.emptyState}>No hay proveedores registrados</p>}
    </div>
  );
}
