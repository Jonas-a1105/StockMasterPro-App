import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLogo } from '@shared/ui/AppLogo';
import { useTheme } from '@contexts/ThemeContext';
import { PLANS, getFeaturesForPlan, type PlanTier } from '@shared/lib/plan-features';
import styles from './LandingPage.module.css';

const TIERS: PlanTier[] = ['free', 'pro', 'enterprise'];

const ANIM_SRC: Record<string, string> = {
  '🛒': '/animations/shopping.json',
  '📦': '/animations/folder.json',
  '📊': '/animations/analytics.json',
  '👥': '/animations/account.json',
  '💰': '/animations/wallet.json',
  '📱': '/animations/wifi.json',
  '🔒': '/animations/build.json',
  '📅': '/animations/calendar.json',
};

interface LazyLottieProps {
  iconKey: string;
}

function LazyLottie({ iconKey }: LazyLottieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const src = ANIM_SRC[iconKey];
    if (!src || !containerRef.current) return;

    import('lottie-web').then((lottie) => {
      if (cancelled || !containerRef.current) return;
      animRef.current = lottie.default.loadAnimation({
        container: containerRef.current,
        path: src,
        loop: false,
        autoplay: false,
      });
    });

    return () => {
      cancelled = true;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [iconKey]);

  const handleEnter = () => animRef.current?.goToAndPlay(70);
  const handleLeave = () => animRef.current?.goToAndStop(0);

  return (
    <div className={styles.lottieWrap}>
      <div
        ref={containerRef}
        className={styles.lottieIcon}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />
    </div>
  );
}

function PricingCard({
  tier,
  isSelected,
  onSelect,
}: {
  tier: PlanTier;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const plan = PLANS[tier];
  const features = getFeaturesForPlan(tier);
  const isPopular = tier === 'pro';

  return (
    <div
      className={`${styles.card} ${isPopular ? `${styles.popular} ${styles.selected}` : ''}`}
      onClick={onSelect}
    >
      {isPopular && <span className={styles.badge}>MÁS ELEGIDO</span>}
      <div className={styles.cardInner}>
        <div className={styles.cardHeader}>
          <span className={styles.cardLevel}>
            {tier === 'free'
              ? 'NIVEL_ESENCIAL'
              : tier === 'pro'
                ? 'CRECIMIENTO_COMERCIAL'
                : 'PROTECCIÓN_EMPRESARIAL'}
          </span>
          <span className={`${styles.cardDot} ${isSelected ? styles.cardDotActive : ''}`} />
        </div>
        <h3 className={styles.planName}>Plan {plan.name}</h3>
        <p className={styles.planDesc}>{plan.description}</p>
        <div className={styles.priceRow}>
          <span className={styles.priceValue}>$ {plan.price}</span>
          <span className={styles.pricePeriod}>
            {plan.price === 0 ? ' / indefinido' : ' / mes'}
          </span>
        </div>
        <ul className={styles.featureList}>
          {features.map((f) => (
            <li key={f.id} className={styles.featureItem}>
              <svg
                className={styles.checkIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
        <Link
          to={plan.price === 0 ? '/register' : '/pricing'}
          className={`${styles.cta} ${isPopular ? `${styles.ctaActive} ${styles.ctaShimmer}` : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {plan.price === 0 ? 'Registrar Caja Free ➔' : `Contratar ${plan.name} ➔`}
        </Link>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { config, toggleDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>('pro');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <div className={styles.logoWrap}>
            <AppLogo size={84} />
            <span className={styles.logoText}>STOCKMASTER PRO</span>
          </div>
          <button className={styles.themeToggle} onClick={toggleDarkMode} aria-label="Toggle theme">
            {config.darkMode ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`} />
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`} />
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`} />
          </button>
          <div className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
            <a href="#features" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              CARACTERÍSTICAS
            </a>
            <a href="#pricing" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              PLANES
            </a>
            <a href="#download" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              DESCARGAR
            </a>
            <Link to="/login" className={styles.navLink} onClick={() => setMenuOpen(false)}>
              INICIAR SESIÓN
            </Link>
            <Link to="/register" className={styles.navCta} onClick={() => setMenuOpen(false)}>
              REGISTRARSE
            </Link>
          </div>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroTag}>EVALUACIÓN DE INVERSIÓN COMERCIAL</span>
          <h1 className={styles.heroTitle}>
            CONTROLA TU NEGOCIO
            <br />
            DESDE CUALQUIER LUGAR
          </h1>
          <p className={styles.heroSub}>
            Punto de venta, inventario, finanzas y más — todo en una plataforma moderna.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.heroCta}>
              COMENZAR GRATIS
            </Link>
            <a href="#features" className={styles.heroSecondary}>
              VER CARACTERÍSTICAS
            </a>
          </div>
        </div>
      </section>

      <section id="features" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>TODO LO QUE NECESITAS</h2>
          <p className={styles.sectionSub}>Módulos completos para gestionar tu negocio</p>
          <div className={styles.featureGrid}>
            {[
              {
                icon: '🛒',
                title: 'PUNTO DE VENTA',
                desc: 'POS rápido con búsqueda, carritos múltiples y métodos de pago variados.',
              },
              {
                icon: '📦',
                title: 'INVENTARIO',
                desc: 'Control de stock, órdenes de compra, ajustes, Kardex y múltiples almacenes.',
              },
              {
                icon: '📊',
                title: 'REPORTES',
                desc: 'Dashboard con KPIs, utilidad neta, best-sellers y productos muertos.',
              },
              {
                icon: '👥',
                title: 'CLIENTES',
                desc: 'Cartera de clientes con límites de crédito, historial de compras y pagos.',
              },
              {
                icon: '💰',
                title: 'FINANZAS',
                desc: 'Cuentas por pagar, gastos fijos, notas de crédito y utilidad neta.',
              },
              {
                icon: '📱',
                title: 'OFFLINE / PWA',
                desc: 'Funciona sin internet. Sincronización automática al recuperar conexión.',
              },
              {
                icon: '🔒',
                title: 'MULTI-TENANT',
                desc: 'Aislamiento seguro de datos entre empresas con RLS.',
              },
              {
                icon: '📅',
                title: 'AGENDA DIGITAL',
                desc: 'Calendario de eventos y recordatorios para tu equipo.',
              },
            ].map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <LazyLottie iconKey={f.icon} />
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.sectionPricing}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>PLANES DE COBERTURA INTEGRALES</h2>
          <p className={styles.sectionSub}>Elige el plan que mejor se adapte a tu negocio</p>
          <div className={styles.pricingGrid}>
            {TIERS.map((tier) => (
              <PricingCard
                key={tier}
                tier={tier}
                isSelected={selectedTier === tier}
                onSelect={() => setSelectedTier(tier)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="download" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>DESCARGA LA APP DE ESCRITORIO</h2>
          <p className={styles.sectionSub}>Rendimiento nativo para Windows con Tauri</p>
          <div className={styles.downloadGrid}>
            <a href="#" className={styles.downloadCard}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span className={styles.downloadTitle}>Windows 64-bit</span>
              <span className={styles.downloadSub}>Instalador .msi</span>
            </a>
            <a href="#" className={styles.downloadCard}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span className={styles.downloadTitle}>Windows 32-bit</span>
              <span className={styles.downloadSub}>Instalador .msi</span>
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} STOCKMASTER PRO. TODOS LOS DERECHOS RESERVADOS.</p>
      </footer>
    </div>
  );
}
