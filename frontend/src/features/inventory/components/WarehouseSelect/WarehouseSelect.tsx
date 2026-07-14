import { Select } from '@shared/ui';

interface WarehouseSelectProps {
  value: string;
  onChange: (value: string) => void;
  warehouses: { id: string; name: string; isActive: boolean }[];
}

export function WarehouseSelect({ value, onChange, warehouses }: WarehouseSelectProps) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: 'Todos los almacenes' },
        ...warehouses.filter((w) => w.isActive).map((w) => ({ value: w.id, label: w.name })),
      ]}
      className="min-w-[160px]"
    />
  );
}