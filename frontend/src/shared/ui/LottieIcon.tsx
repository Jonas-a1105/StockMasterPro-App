import { useEffect, useRef, useState, useCallback } from 'react';
import lottie from 'lottie-web';
import styles from './LottieIcon.module.css';

interface Props {
  data?: any;
  src?: any;
  size?: number;
  play?: boolean;
  hoverPlay?: boolean;
}

export function LottieIcon({ data, src, size = 24, play = true, hoverPlay }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const loaded = useRef(false);

  const rawData = data || src;
  const shouldPlay = hoverPlay ? hovered : play;

  useEffect(() => {
    if (!ref.current || !rawData || loaded.current) return;
    loaded.current = true;
    animRef.current = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      loop: true,
      autoplay: shouldPlay,
      animationData: rawData,
    });
    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
      loaded.current = false;
    };
  }, [rawData]);

  useEffect(() => {
    if (!animRef.current) return;
    if (shouldPlay) {
      animRef.current.play();
    } else {
      animRef.current.goToAndStop(0, true);
    }
  }, [shouldPlay]);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <div
      ref={ref}
      onMouseEnter={hoverPlay ? handleMouseEnter : undefined}
      onMouseLeave={hoverPlay ? handleMouseLeave : undefined}
      className={`lottie-icon ${styles.icon} ${hoverPlay ? styles.iconClickable : ''}`}
      style={{ '--lottie-size': size } as React.CSSProperties}
    />
  );
}
