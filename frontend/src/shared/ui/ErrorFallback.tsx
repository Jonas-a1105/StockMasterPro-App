import { RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './ErrorFallback.module.css';

interface Props {
  error: Error | null;
  reset: () => void;
}

export function ErrorFallback({ error, reset }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <RefreshCw size={64} className={styles.spin} />
        </div>
        <h1 className={styles.title}>Error inesperado</h1>
        <p className={styles.message}>
          Algo salió mal. Intenta recargar la página o volver al inicio.
        </p>
        {error && (
          <details className={styles.errorDetails}>
            <summary>Detalles del error</summary>
            <pre>{error.message}</pre>
            {error.stack && <pre>{error.stack}</pre>}
          </details>
        )}
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={reset}>
            <RefreshCw size={18} /> Reintentar
          </button>
          <Link to="/" className={styles.btnSecondary}>
            <Home size={18} /> Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
