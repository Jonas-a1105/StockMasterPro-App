import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@shared/lib/http/client';
import styles from './AuthPage.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

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
            <span className={styles.indicatorText}>PASSWORD_RECOVERY</span>
          </div>
          {sent ? (
            <h2 className={styles.title}>Correo enviado</h2>
          ) : (
            <h2 className={styles.title}>Recuperar contraseña</h2>
          )}
        </div>

        {sent ? (
          <>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0', fontSize: 14 }}>
              Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link to="/login" className={styles.footerLinkAccent} style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>Volver al inicio de sesión</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0', fontSize: 14 }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.field}>
              <label>Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} placeholder="tu@correo.com" required />
            </div>
            <button type="submit" className={`${styles.submitBtn} ${styles.btnShimmer}`} disabled={loading || !email}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <Link to="/login" className={styles.footerLinkAccent} style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>Volver al inicio de sesión</Link>
          </form>
        )}
      </div>
    </div>
  );
}
