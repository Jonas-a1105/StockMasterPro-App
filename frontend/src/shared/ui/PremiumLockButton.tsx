import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PremiumLockButton.module.css';

interface PremiumLockButtonProps {
  label?: string;
  sublabel?: string;
  requiredPlan: 'intermedio' | 'pro';
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

export function PremiumLockButton({
  label = 'Bloqueado',
  sublabel = 'Mantén pulsado',
  requiredPlan,
  width = '208px',
  height = '56px',
  style,
}: PremiumLockButtonProps) {
  const navigate = useNavigate();
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const timerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    if (isUnlocked) return;
    e.preventDefault();
    setIsPressing(true);
    setProgress(0);

    const startTime = Date.now();
    const duration = 1500; // 1.5s

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
    }, 30);

    timerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);
      setIsUnlocked(true);
      setIsPressing(false);

      if (navigator.vibrate) {
        navigator.vibrate(80);
      }

      // Redirect after unlock animation finishes
      setTimeout(() => {
        navigate(`/settings?tab=licenses&upgrade=${requiredPlan}`);
      }, 500);
    }, duration);
  };

  const endHold = () => {
    if (isUnlocked) return;
    setIsPressing(false);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div
      className={styles.container}
      style={{ '--plb-w': width, '--plb-h': height, ...style } as React.CSSProperties}
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
    >
      {/* SVG Lock */}
      <div className={styles.lockWrapper}>
        <svg
          className={`${styles.lockSvg} ${isUnlocked ? styles.unlocked : ''}`}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arco de candado (shackle) */}
          <path
            className={styles.shackle}
            d="M10 13.5V9.5C10 6.186 12.686 3.5 16 3.5C19.314 3.5 22 6.186 22 9.5V13.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cuerpo Rectangular */}
          <rect
            x="6"
            y="13"
            width="20"
            height="15"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="2.2"
            fill="none"
          />
          {/* Ojo de la cerradura */}
          <circle cx="16" cy="19" r="2" stroke="currentColor" strokeWidth="2.2" fill="none" />
          <path d="M16 21V24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Button */}
      <button type="button" className={`${styles.button} ${isPressing ? styles.buttonActive : ''}`}>
        <span className={styles.label}>{label}</span>
        <span className={styles.sublabel}>
          {isUnlocked ? '¡Desbloqueado!' : isPressing ? 'Cargando...' : sublabel}
        </span>
        {/* Progress bar overlay */}
        <div
          className={styles.progress}
          style={{ '--plb-progress': `${progress}%` } as React.CSSProperties}
        />
      </button>
    </div>
  );
}
