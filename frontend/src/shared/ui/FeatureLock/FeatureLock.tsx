import { Lock } from 'lucide-react';
import styles from './FeatureLock.module.css';

interface FeatureLockProps {
  message?: string;
  children: React.ReactNode;
}

export function FeatureLock({ message, children }: FeatureLockProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.overlay}>
        <Lock size={16} />
        <span className={styles.text}>{message || 'Disponible en plan superior'}</span>
      </div>
      {children}
    </div>
  );
}