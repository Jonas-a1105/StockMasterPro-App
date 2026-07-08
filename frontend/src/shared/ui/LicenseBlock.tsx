import { useState } from 'react';
import { Ban, CreditCard, ArrowLeft } from 'lucide-react';
import { Spinner } from './Spinner';
import { useAuth } from '@contexts/AuthContext';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import styles from './LicenseBlock.module.css';

interface LicenseBlockProps {
  onActivate: (code: string) => Promise<void>;
}

export function LicenseBlock({ onActivate }: LicenseBlockProps) {
  const { dismissLicenseBlock } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Stripe States
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPlanForStripe, setSelectedPlanForStripe] = useState<string | null>(null);
  const [showPlanSelect, setShowPlanSelect] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onActivate(code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowStripeModal(false);
    dismissLicenseBlock();
  };

  if (showPlanSelect) {
    return (
      <div className={styles.overlay}>
        <div className={`${styles.modal} ${styles.modalPlans}`}>
          <div className={styles.headerRow}>
            <button className={styles.btnBack} onClick={() => setShowPlanSelect(false)}>
              <ArrowLeft size={16} /> Volver
            </button>
            <h3>Planes Premium</h3>
          </div>
          <p className={styles.desc}>
            Suscríbete ahora para reactivar tu cuenta y acceder a todas las herramientas profesionales.
          </p>

          <div className={styles.plansGrid}>
            <div className={styles.planCard}>
              <h4>Plan PRO</h4>
              <div className={styles.price}>$39 <span>/ mes</span></div>
              <ul className={styles.features}>
                <li>Inventario ilimitado</li>
                <li>Hasta 5 usuarios</li>
                <li>Cuentas por pagar</li>
              </ul>
              <button 
                className={styles.btnPay} 
                onClick={() => { setSelectedPlanForStripe('pro'); setShowStripeModal(true); }}
              >
                Suscribirse PRO
              </button>
            </div>

            <div className={`${styles.planCard} ${styles.recommended}`}>
              <span className={styles.badge}>RECOMENDADO</span>
              <h4>Plan Enterprise</h4>
              <div className={styles.price}>$79 <span>/ mes</span></div>
              <ul className={styles.features}>
                <li>Todo ilimitado</li>
                <li>PWA offline</li>
                <li>Soporte 24/7</li>
              </ul>
              <button 
                className={styles.btnPayPrimary} 
                onClick={() => { setSelectedPlanForStripe('enterprise'); setShowStripeModal(true); }}
              >
                Suscribirse Enterprise
              </button>
            </div>
          </div>

          <StripeCheckoutModal
            open={showStripeModal}
            planType={selectedPlanForStripe || ''}
            onClose={() => { setShowStripeModal(false); setSelectedPlanForStripe(null); }}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <Ban size={48} className={styles.icon} />
        <h2>Licencia Expirada</h2>
        <p>Tu licencia ha expirado. Por favor, introduce un nuevo código de activación o contacta al administrador.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Código de activación"
            className={styles.input}
            required
          />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? <><Spinner size={16} /> Validando</> : 'Activar'}
          </button>
          
          <div className={styles.divider}>
            <span>O TAMBIÉN</span>
          </div>

          <button 
            type="button" 
            className={styles.btnStripe} 
            onClick={() => setShowPlanSelect(true)}
          >
            <CreditCard size={14} /> Pagar con Tarjeta (Stripe)
          </button>
        </form>
      </div>
    </div>
  );
}
