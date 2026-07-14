import { Stack, Button } from '@shared/ui';

type TabKey = 'general' | 'kardex';

interface TabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <Stack direction="row" gap="sm" className="tabbar">
      <Button
        variant={activeTab === 'general' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('general')}
      >
        VISTA GENERAL
      </Button>
      <Button
        variant={activeTab === 'kardex' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('kardex')}
      >
        KARDEX DE INVENTARIO
      </Button>
    </Stack>
  );
}