import { useRef, useEffect } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import spinnerData from '@assets/lottie/spinner-dashes.json';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number;
}

export function Spinner({ size = 18 }: SpinnerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const anim = lottie.loadAnimation({
      container: ref.current,
      animationData: spinnerData,
      autoplay: true,
      loop: true,
    });
    animRef.current = anim;
    return () => anim.destroy();
  }, []);

  return (
    <div
      ref={ref}
      className={styles.spinner}
      style={{ '--spinner-size': size } as React.CSSProperties}
    />
  );
}
