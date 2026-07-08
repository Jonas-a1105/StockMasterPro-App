import { Spinner } from './Spinner';
import styles from './LoadingDots.module.css';

export function LoadingDots({ text = 'Cargando' }: { text?: string }) {
  return (
    <div className={styles.container}>
      <Spinner size={48} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
