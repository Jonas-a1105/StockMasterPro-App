import styles from './ButtonLoader.module.css';

interface ButtonLoaderProps {
  className?: string;
}

export function ButtonLoader({ className = '' }: ButtonLoaderProps) {
  return (
    <span className={`${styles.dotsContainer} ${className}`} aria-hidden="true">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}
