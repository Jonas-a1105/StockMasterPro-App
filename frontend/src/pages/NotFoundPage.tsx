import { Link } from 'react-router-dom';
import { Home, RotateCcw, Search, AlertTriangle } from 'lucide-react';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={64} />
        </div>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Página no encontrada</h2>
        <p className={styles.message}>La página que buscas no existe o ha sido movida.</p>
        <div className={styles.actions}>
          <Link to="/" className={styles.btnPrimary}>
            <Home size={18} /> Ir al inicio
          </Link>
          <button className={styles.btnSecondary} onClick={() => window.history.back()}>
            <RotateCcw size={18} /> Volver atrás
          </button>
        </div>
        <div className={styles.searchHint}>
          <Search size={16} /> ¿Buscas algo específico? Usa la navegación del menú lateral.
        </div>
      </div>
    </div>
  );
}
