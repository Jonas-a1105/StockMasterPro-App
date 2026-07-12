import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@shared/lib/http/client';
import styles from './AuthPage.module.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>SM</div>
          <h1 className={styles.headerTitle}>StockMaster Pro</h1>
        </div>
        <div className={styles.authCard}>
          <h2 className={styles.title}>Enlace inválido</h2>
          <p
            className={`${styles.colorTextMuted} ${styles.fontSize14} ${styles.mt8} ${styles.mb8}`}
          >
            El enlace de restablecimiento no es válido o ha expirado.
          </p>
          <Link to="/forgot-password" className={styles.footerLinkAccent}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>SM</div>
          <h1 className={styles.headerTitle}>StockMaster Pro</h1>
        </div>
        <div className={styles.authCard}>
          <h2 className={styles.title}>Contraseña actualizada</h2>
          <p
            className={`${styles.colorTextMuted} ${styles.fontSize14} ${styles.mt8} ${styles.mb8}`}
          >
            Tu contraseña se ha restablecido correctamente.
          </p>
          <Link to="/login" className={styles.footerLinkAccent}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authHeader}>
        <div className={styles.logo}>SM</div>
        <h1 className={styles.headerTitle}>StockMaster Pro</h1>
      </div>
      <div className={styles.authCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.indicatorRow}>
            <div className={styles.indicatorDot} />
            <span className={styles.indicatorText}>RESET_PASSWORD</span>
          </div>
          <h2 className={styles.title}>Restablecer contraseña</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div className={styles.field}>
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={styles.input}
              placeholder="Repite la contraseña"
              required
            />
          </div>
          <button
            type="submit"
            className={`${styles.submitBtn} ${styles.btnShimmer}`}
            disabled={loading || !password || !confirm}
          >
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
          <Link
            to="/login"
            className={`${styles.footerLinkAccent} ${styles.textCenter} ${styles.block} ${styles.mt16}`}
          >
            Volver al inicio de sesión
          </Link>
        </form>
      </div>
    </div>
  );
}
