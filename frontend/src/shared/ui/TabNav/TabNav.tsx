import { type ReactNode } from 'react';
import styles from './TabNav.module.css';

export interface TabNavItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TabNavProps {
  tabs: TabNavItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: TabNavProps) {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
