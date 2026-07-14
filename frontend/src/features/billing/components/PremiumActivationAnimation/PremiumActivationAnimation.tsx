import { useEffect, useRef } from 'react';
import styles from './PremiumActivationAnimation.module.css';

interface Props {
  onClose: () => void;
}

export function PremiumActivationAnimation({ onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const rebootSequence = () => {
    if (ref.current) {
      const clone = ref.current.cloneNode(true) as HTMLDivElement;
      ref.current.parentNode?.replaceChild(clone, ref.current);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.cinemaWrapper} ref={ref}>
        <div className={styles.gridSpace} />

        <div className={`${styles.hudTerminal} ${styles.hudTopLeft}`}>
          <div>SYS_AUTH_MODE: AUTHENTICATED</div>
          <div className={styles.dataStream}>FETCHING_MANIFEST_DATA</div>
        </div>
        <div className={`${styles.hudTerminal} ${styles.hudTopRight}`}>
          <div>NODE: CLUSTER_04_P</div>
          <div className={styles.hudOrange}>CORE_STATUS: READY</div>
        </div>
        <div className={`${styles.hudTerminal} ${styles.hudBotLeft}`}>
          <div>LATENCY: 12ms</div>
          <div>SECURITY: BYPASS_OK</div>
        </div>

        <div className={`${styles.laserLine} ${styles.laserH}`} />

        <div className={styles.energyLoaderTrack}>
          <div className={styles.energyBar} />
        </div>

        <div className={styles.whiteoutFlash} />
        <div className={`${styles.blastRing} ${styles.br1}`} />
        <div className={`${styles.blastRing} ${styles.br2}`} />
        <div className={`${styles.blastRing} ${styles.br3}`} />

        <div className={styles.shrapnelField}>
          <span className={styles.chunk} />
          <span className={styles.chunk} />
          <span className={styles.chunk} />
          <span className={styles.chunk} />
          <span className={styles.chunk} />
          <span className={styles.chunk} />
        </div>

        <div className={styles.emblemTheater}>
          <div className={styles.outerRingBracket} />
          <div className={styles.innerRingBracket} />

          <svg className={styles.assemblySvg} viewBox="0 0 200 200">
            <path className={styles.pieceSub} d="M60 60 h80 v80 h-80 z" />
            <path className={styles.pieceSub} d="M100 30 L170 100 L100 170 L30 100 Z" />

            <path className={styles.pieceN} d="M100 15 L125 55 L100 80 L75 55 Z" />
            <path className={styles.pieceE} d="M185 100 L145 125 L120 100 L145 75 Z" />
            <path className={styles.pieceS} d="M100 185 L75 145 L100 120 L125 145 Z" />
            <path className={styles.pieceW} d="M15 100 L55 75 L80 100 L55 125 Z" />

            <path className={styles.brandCore} d="M90 75 h18 c10 0 10 12 0 12 h-18 M90 70 v55" />
          </svg>
        </div>

        <div className={styles.textEngine}>
          <div className={styles.gateOverflow}>
            <span className={styles.kBadge}>Nivel de Cuenta: Elevado</span>
          </div>
          <div className={styles.gateOverflow}>
            <h1 className={styles.kTitle}>
              SISTEMA <span className={styles.kTitleSpan}>PREMIUM</span>
            </h1>
          </div>
          <div className={styles.gateOverflow}>
            <p className={styles.kDesc}>Estructuras y privilegios de datos optimizados</p>
          </div>
        </div>

        <div className={styles.gateButtonArea}>
          <button className={styles.btnPremiumLaunch} onClick={onClose}>
            Acceder al Panel
          </button>
        </div>
      </div>

      <button className={styles.systemRebootTrigger} onClick={rebootSequence}>
        Reiniciar Sistema
      </button>
    </div>
  );
}
