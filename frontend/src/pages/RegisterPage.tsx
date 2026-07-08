import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ButtonLoader } from '../components/common/ButtonLoader';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar contraseña
    const isPassValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    if (!isPassValid) {
      setError('La contraseña debe cumplir con todos los requisitos de criptografía.');
      return;
    }

    setLoading(true);
    try {
      await register({ tenantName, email, password, name });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  // Validación de requisitos en tiempo real
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passedCount = password.length === 0 ? 0 : Object.values(checks).filter(Boolean).length;

  let strengthLabel = 'Sin_Datos';
  let strengthColor = '#666666';
  let strengthWidth = '0%';
  let strengthBarColor = '#141414';

  if (password.length > 0) {
    if (passedCount === 1) {
      strengthLabel = 'Clave_Insegura';
      strengthColor = '#f87171';
      strengthWidth = '33%';
      strengthBarColor = '#dc2626';
    } else if (passedCount === 2) {
      strengthLabel = 'Riesgo_Moderado';
      strengthColor = '#fb923c';
      strengthWidth = '66%';
      strengthBarColor = '#f97316';
    } else if (passedCount === 3) {
      strengthLabel = 'Criptografía_Fuerte';
      strengthColor = '#9ee63c';
      strengthWidth = '100%';
      strengthBarColor = '#9ee63c';
    }
  }

  return (
    <div className={styles.authContainer}>
      {/* CONTENEDOR DE ENCABEZADO CENTRAL */}
      <div className={styles.authHeader}>
        <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
          <svg viewBox="0 0 240 240" fill="none" width="84" height="84" style={{ overflow: 'visible' }}>
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
              stroke="#9ee63c"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x="144" y="141" fill="#9ee63c" fontSize="16" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.05em">PRO</text>
          </svg>
        </div>
        <h1 className={styles.headerTitle}>¡Bienvenido!</h1>
      </div>

      {/* TARJETA PRINCIPAL */}
      <div className={styles.authCard} style={{ borderColor: '#222222' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.indicatorRow}>
            <div className={styles.indicatorDotRegister} />
            <span className={styles.indicatorText}>PROVISION // REGISTER_NODE</span>
          </div>
          <h2 className={styles.title}>Alta de Nodo Operativo</h2>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Nombre de la Empresa */}
          <div className={styles.field}>
            <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#666666', textTransform: "none", letterSpacing: '0.5px' }}>
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={e => setTenantName(e.target.value)}
              required
              className={styles.input}
              placeholder="Mi Tienda"
            />
          </div>

          {/* Nombre del Operador */}
          <div className={styles.field}>
            <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#666666', textTransform: "none", letterSpacing: '0.5px' }}>
              Nombre del Operador
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className={styles.input}
              placeholder="Ej. Jonás Mendoza"
            />
          </div>

          {/* Correo Institucional */}
          <div className={styles.field}>
            <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#666666', textTransform: "none", letterSpacing: '0.5px' }}>
              Correo Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="operador@empresa.com"
            />
          </div>

          {/* Establecer Contraseña Maestra */}
          <div className={styles.field}>
            <label style={{ fontSize: '10px', fontFamily: 'monospace', color: '#666666', textTransform: "none", letterSpacing: '0.5px' }}>
              Establecer Contraseña Maestra
            </label>
            <div className={styles.inputWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          {/* Fuerza de Clave */}
          <div className={styles.field} style={{ marginBottom: '8px' }}>
            <div className={styles.strengthHeader}>
              <span>Seguridad de Clave</span>
              <span style={{ color: strengthColor, fontWeight: 'bold' }}>{strengthLabel}</span>
            </div>
            <div className={styles.strengthBarContainer}>
              <div
                className={styles.strengthBar}
                style={{ width: strengthWidth, backgroundColor: strengthBarColor }}
              />
            </div>
          </div>

          {/* Lista de Requisitos */}
          <div className={styles.requirementsList}>
            <div className={`${styles.requirementRow} ${checks.length ? styles.requirementRowActive : ''}`}>
              <div className={styles.reqIcon}>
                {checks.length ? (
                  <Check size={12} style={{ color: '#9ee63c' }} />
                ) : (
                  <X size={12} style={{ color: '#dc2626' }} />
                )}
              </div>
              <span>Mínimo 8 caracteres obligatorios</span>
            </div>

            <div className={`${styles.requirementRow} ${checks.upper ? styles.requirementRowActive : ''}`}>
              <div className={styles.reqIcon}>
                {checks.upper ? (
                  <Check size={12} style={{ color: '#9ee63c' }} />
                ) : (
                  <X size={12} style={{ color: '#dc2626' }} />
                )}
              </div>
              <span>Incluir al menos una letra mayúscula</span>
            </div>

            <div className={`${styles.requirementRow} ${checks.number ? styles.requirementRowActive : ''}`}>
              <div className={styles.reqIcon}>
                {checks.number ? (
                  <Check size={12} style={{ color: '#9ee63c' }} />
                ) : (
                  <X size={12} style={{ color: '#dc2626' }} />
                )}
              </div>
              <span>Incluir al menos un dígito numérico</span>
            </div>
          </div>

          {/* Botón de Envío Verde */}
          <button
            type="submit"
            disabled={loading}
            className={`${styles.submitBtn} ${styles.submitBtnRegister} ${styles.btnShimmer}`}
          >
            {loading ? (
              <ButtonLoader />
            ) : (
              'Dar de Alta Operador ➔'
            )}
          </button>
        </form>
      </div>

      {/* ENLACES INFERIORES */}
      <div className={styles.footerLinks}>
        <p style={{ margin: 0, fontSize: '11px', color: '#666666' }}>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className={`${styles.footerLinkAccent} ${styles.footerLinkAccentLogin}`}>
            Inicia Sesión
          </Link>
        </p>
        <p style={{ marginTop: '12px', fontSize: '11px' }}>
          <Link to="/" style={{ color: '#666666', textDecoration: 'none' }}>➔ Volver al Inicio (Landing)</Link>
        </p>
      </div>
    </div>
  );
}
