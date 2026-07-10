import { useRef, useEffect } from 'react';
import styles from './AriaLiveRegion.module.css';

export function AriaLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAnnounce = (event: CustomEvent) => {
      const { message, politeness = 'polite' } = event.detail;
      if (liveRegionRef.current) {
        liveRegionRef.current.setAttribute('aria-live', politeness);
        liveRegionRef.current.textContent = '';
        // Force re-read by clearing and setting
        requestAnimationFrame(() => {
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = message;
          }
        });
      }
    };

    window.addEventListener('announce', handleAnnounce as EventListener);
    return () => window.removeEventListener('announce', handleAnnounce as EventListener);
  }, []);

  return (
    <div
      ref={liveRegionRef}
      className={styles.liveRegion}
      aria-live="polite"
      aria-atomic="true"
      aria-busy="false"
    />
  );
}

export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  window.dispatchEvent(new CustomEvent('announce', { detail: { message, politeness } }));
}