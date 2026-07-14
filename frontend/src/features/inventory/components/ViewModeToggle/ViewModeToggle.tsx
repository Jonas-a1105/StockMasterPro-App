import { Button } from '@shared/ui';
import { LayoutList, LayoutGrid } from 'lucide-react';

interface ViewModeToggleProps {
  mode: 'table' | 'cards';
  onChange: (mode: 'table' | 'cards') => void;
  onConfigUpdate?: (mode: 'table' | 'cards') => void;
}

export function ViewModeToggle({ mode, onChange, onConfigUpdate }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant={mode === 'table' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => { onChange('table'); onConfigUpdate?.('table'); }}
        aria-label="Vista de tabla"
      >
        <LayoutList size={15} />
      </Button>
      <Button
        type="button"
        variant={mode === 'cards' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => { onChange('cards'); onConfigUpdate?.('cards'); }}
        aria-label="Vista de tarjetas"
      >
        <LayoutGrid size={15} />
      </Button>
    </div>
  );
}