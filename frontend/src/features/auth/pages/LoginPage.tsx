import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { Eye, EyeOff, User } from 'lucide-react';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('stockmaster-remember', email);
      } else {
        localStorage.removeItem('stockmaster-remember');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      {/* CONTENEDOR DE ENCABEZADO CENTRAL */}
      <div className={styles.authHeader}>
        <div className={styles.logoBox}>
          <svg
            viewBox="0 0 240 240"
            fill="none"
            width="84"
            height="84"
            className={styles.overflowVisible}
          >
            <path
              d="M 65 90 C 40 90, 40 115, 60 120 C 80 125, 80 150, 55 150 L 85 85 L 105 125 L 125 85 L 125 150 H 185 V 115 H 135 V 150"
              fill="none"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 145 110 L 140 97 L 151 102 L 160 88 L 169 102 L 180 97 L 175 110 Z"
              fill="none"
              stroke="var(--color-primary, #f05a28)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="144"
              y="141"
              fill="var(--color-primary, #f05a28)"
              fontSize="16"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="0.05em"
            >
              PRO
            </text>
          </svg>
        </div>
        <h1 className={styles.headerTitle}>¡Bienvenido!</h1>
      </div>

      {/* TARJETA PRINCIPAL */}
      <div className={styles.authCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.indicatorRow}>
            <div className={styles.indicatorDot} />
            <span className={styles.indicatorText}>GATEWAY // SECURE_ACCESS</span>
          </div>
          <h2 className={styles.title}>Acceso al Sistema Central</h2>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.flexColumnGap16}>
          {/* Identificador */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label>Identificador de Usuario</label>
              <User size={14} className={styles.colorIcon} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="usuario@empresa.com"
            />
          </div>

          {/* Clave Criptográfica */}
          <div className={styles.field}>
            <div className={styles.fieldHeader}>
              <label>Clave Criptográfica</label>
              <Link to="/forgot-password" className={styles.forgotLink}>
                ¿olvidó su clave?
              </Link>
            </div>
            <div className={styles.inputWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Checkbox */}
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className={styles.checkbox}
            />
            <div className={styles.checkboxCustom}>
              {rememberMe && (
                <svg
                  className={styles.checkboxCheckIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className={styles.checkboxText}>
              Mantener estación autenticada en esta terminal
            </span>
          </label>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            className={`${styles.submitBtn} ${styles.btnShimmer}`}
          >
            {loading ? <ButtonLoader /> : 'Autenticar Estación ➔'}
          </button>
        </form>
      </div>

      {/* ENLACES INFERIORES */}
      <div className={styles.footerLinks}>
        <p className={`${styles.m0} ${styles.fontSize11} ${styles.colorMuted}`}>
          ¿No tienes una cuenta?{' '}
          <Link
            to="/register"
            className={`${styles.footerLinkAccent} ${styles.footerLinkAccentRegister}`}
          >
            Regístrate
          </Link>
        </p>
        <p className={`${styles.mt12} ${styles.fontSize11}`}>
          <Link to="/" className={`${styles.textDecorationNone} ${styles.colorMuted}`}>
            ➔ Volver al Inicio (Landing)
          </Link>
        </p>
      </div>
    </div>
  );
}
