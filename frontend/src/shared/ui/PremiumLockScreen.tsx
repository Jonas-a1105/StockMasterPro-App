import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PremiumLockButton } from './PremiumLockButton';
import styles from './PremiumLockScreen.module.css';

interface PremiumLockScreenProps {
  sectionName: string;
  requiredPlan: 'intermedio' | 'pro';
}

export function PremiumLockScreen({ sectionName, requiredPlan }: PremiumLockScreenProps) {
  const planLabel = requiredPlan === 'intermedio' ? 'Plan Intermedio' : 'Plan PRO';
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={32} />
        </div>
        <h2 className={styles.title}>Función Bloqueada</h2>
        <p className={styles.subtitle}>
          El acceso a <strong style={{ color: 'var(--text-dark, #fff)' }}>{sectionName}</strong> no está disponible en tu plan actual.
        </p>
        <p className={styles.desc}>
          Esta característica premium requiere contar con una suscripción activa al <strong>{planLabel}</strong> o superior.
        </p>

        <div className={styles.buttonWrapper}>
          <PremiumLockButton
            label="Bloqueado"
            sublabel="Mantén pulsado para actualizar"
            requiredPlan={requiredPlan}
          />
        </div>
      </div>
    </div>
  );
}
