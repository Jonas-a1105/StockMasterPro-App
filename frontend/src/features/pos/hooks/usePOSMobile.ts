import { useEffect, useCallback } from 'react';
import styles from './POSMobile.module.css';

export function usePOSMobile() {
  // Safe area insets for notched devices
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-top: env(safe-area-inset-top, 0px);
        --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-left: env(safe-area-inset-left, 0px);
        --safe-area-right: env(safe-area-inset-right, 0px);
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Prevent zoom on input focus (iOS)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="text"], input[type="number"], input[type="email"], 
      input[type="tel"], textarea, select {
        font-size: 16px !important;
      }
      @media (max-width: 768px) {
        input, select, textarea {
          font-size: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Prevent zoom on double tap
  useEffect(() => {
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);

  // Prevent pull-to-refresh on POS
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (startY <= 50 && e.touches[0].clientY > startY + 50) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Virtual keyboard handling
  const handleKeyboard = useCallback(() => {
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-open {
        padding-bottom: env(keyboard-height, 0px);
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return { styles };
}

// Touch target styles
export const touchStyles = `
  /* Minimum 48x48 touch targets */
  button, 
  a[role="button"],
  input[type="button"],
  input[type="submit"],
  .btn,
  .paymentBtn {
    min-height: 48px;
    min-width: 48px;
  }

  /* Input fields on mobile */
  @media (max-width: 768px) {
    input, select, textarea {
      font-size: 16px !important; /* Prevents zoom on iOS */
      min-height: 48px;
      padding: 12px 16px;
    }
    
    /* Larger touch targets for POS buttons */
    .paymentBtn, .quantityBtn, .actionBtn {
      min-height: 56px;
      min-width: 56px;
      padding: 12px 24px;
      font-size: 16px;
    }

    /* Safe area padding */
    .pos-container {
      padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
    }

    /* Cart panel safe area */
    .cartPanel {
      padding-bottom: max(env(safe-area-inset-bottom, 0px), 24px);
    }

    /* Modal safe area */
    .modal {
      padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
    }
  }

  /* Landscape orientation adjustments */
  @media (max-width: 768px) and (orientation: landscape) {
    .pos-container {
      height: 100vh;
      height: 100dvh; /* Dynamic viewport height for mobile */
    }
    
    .cartPanel {
      height: 100%;
      max-height: 100%;
    }
  }

  /* Prevent text selection on touch targets */
  button, .btn, .actionBtn {
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
`;
