import styles from './AppLogo.module.css';

export function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      className={styles.logo}
      viewBox="0 0 240 240"
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F07F19" />
          <stop offset="100%" stopColor="#f05a28" />
        </linearGradient>
      </defs>
      <path
        className={styles.stroke}
        d="M 65 90 C 40 90, 40 115, 60 120 C 80 125, 80 150, 55 150 L 85 85 L 105 125 L 125 85 L 125 150 H 185 V 115 H 135 V 150"
      />
      <path
        className={styles.crown}
        d="M 145 110 L 140 97 L 151 102 L 160 88 L 169 102 L 180 97 L 175 110 Z"
      />
      <text x="144" y="141" className={styles.proText}>PRO</text>
    </svg>
  );
}
