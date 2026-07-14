import { SelectDropdown } from '@shared/ui';
import styles from './WarehouseSelect.module.css';

interface WarehouseSelectProps {
  value: string;
  onChange: (value: string) => void;
  warehouses: { id: string; name: string; isActive: boolean }[];
}

export function WarehouseSelect({ value, onChange, warehouses }: WarehouseSelectProps) {
  return (
    <SelectDropdown
      value={value}
      onChange={onChange}
      placeholder="Todos los almacenes"
      options={warehouses.filter((w) => w.isActive).map((w) => ({ value: w.id, label: w.name }))}
      className={styles.warehouseSelect}
    />
  );
}