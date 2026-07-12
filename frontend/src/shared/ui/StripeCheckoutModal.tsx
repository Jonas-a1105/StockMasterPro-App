import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '@shared/lib/http/client';
import { Spinner } from './Spinner';
import { Modal } from './Modal';
import { useTheme } from '@contexts/ThemeContext';
import styles from './StripeCheckoutModal.module.css';

// Cargar la clave pública de Stripe
const STRIPE_PK =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51PhgRkRqGjG4Fp1k93kPkTestKeyPlaceholder';
const stripePromise = loadStripe(STRIPE_PK);

interface CheckoutFormProps {
  planType: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CheckoutForm({ planType, onClose, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { config } = useTheme();

  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'polling' | 'success'>('form');
  const [pollCount, setPollCount] = useState(0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setProcessing(true);
    setError(null);

    try {
      // 1. Crear la suscripción en el backend para obtener el clientSecret
      const subscriptionData = await api.createSubscription(planType);
      const clientSecret = subscriptionData.clientSecret;

      if (!clientSecret) {
        throw new Error('No se pudo generar la clave secreta de pago.');
      }

      // 2. Confirmar el pago de la tarjeta con Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName || undefined,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Ocurrió un error al procesar el pago.');
        setProcessing(false);
      } else {
        if (
          result.paymentIntent?.status === 'succeeded' ||
          result.paymentIntent?.status === 'requires_capture'
        ) {
          setStep('polling');
        } else {
          setError('El pago requiere acciones adicionales o no ha sido completado.');
          setProcessing(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la suscripción.');
      setProcessing(false);
    }
  };

  // Polling del estado de la licencia para detectar cuando el Webhook ha actualizado la base de datos
  useEffect(() => {
    if (step !== 'polling') return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const status = await api.getLicenseStatus();
        if (status.tier === planType && !status.isBlocked) {
          clearInterval(interval);
          if (active) {
            setStep('success');
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        } else {
          setPollCount((prev) => prev + 1);
          if (pollCount > 15) {
            // Límite de 30 segundos
            clearInterval(interval);
            setError(
              'El pago fue exitoso, pero la activación automática está tardando. Por favor recarga el sistema en unos momentos.'
            );
            setStep('form');
            setProcessing(false);
          }
        }
      } catch {
        // Ignorar fallos de red durante el polling
      }
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [step, planType, pollCount, onSuccess]);

  if (step === 'polling') {
    return (
      <div className={styles.loaderArea}>
        <Spinner size={36} />
        <h4>Confirmando tu pago...</h4>
        <p>Estamos activando tu suscripción en el sistema. Por favor, no cierres esta ventana.</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={styles.successArea}>
        <div className={styles.successIconWrap}>
          <ShieldCheck size={48} className={styles.successIcon} />
        </div>
        <h4>¡Suscripción Activada!</h4>
        <p>
          Tu plan{' '}
          <strong>{planType.charAt(0).toUpperCase() + planType.slice(1).toLowerCase()}</strong> está
          activo. Disfruta de las características premium.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Titular de la tarjeta</label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Nombre como figura en la tarjeta"
          required
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Información de la tarjeta</label>
        <div className={styles.cardElementWrap}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '12px',
                  color: config.darkMode || config.oledMode ? '#ffffff' : '#333333',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  '::placeholder': {
                    color: config.darkMode || config.oledMode ? '#888888' : '#a0aec0',
                  },
                },
                invalid: {
                  color: '#dc2626',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={onClose} className={styles.btnCancel} disabled={processing}>
          Cancelar
        </button>
        <button type="submit" disabled={!stripe || processing} className={styles.btnSubmit}>
          {processing ? (
            <>
              <Spinner size={12} /> Procesando...
            </>
          ) : (
            <>
              <CreditCard size={12} /> Suscribirse al Plan
            </>
          )}
        </button>
      </div>
    </form>
  );
}

interface StripeCheckoutModalProps {
  open: boolean;
  planType: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function StripeCheckoutModal({
  open,
  planType,
  onClose,
  onSuccess,
}: StripeCheckoutModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Pasarela de Pago (Stripe)">
      {open && planType ? (
        <div className={styles.body}>
          <div className={styles.summary}>
            <span className={styles.planLabel}>Plan seleccionado:</span>
            <span className={styles.planValue}>
              StockMaster {planType.charAt(0).toUpperCase() + planType.slice(1).toLowerCase()}
            </span>
          </div>
          <Elements stripe={stripePromise}>
            <CheckoutForm planType={planType} onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        </div>
      ) : null}
    </Modal>
  );
}
