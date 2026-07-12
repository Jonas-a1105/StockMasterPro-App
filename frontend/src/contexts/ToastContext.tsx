import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { sileo } from 'sileo';

export type FlashType = 'success' | 'alert' | 'info';

export interface FlashNotification {
  id: number;
  type: FlashType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  notifications: FlashNotification[];
  showFlash: (type: FlashType, title: string, message: string, duration?: number) => void;
  dismissFlash: (id: number) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeToSileo: Record<FlashType, 'success' | 'error' | 'info'> = {
  success: 'success',
  alert: 'error',
  info: 'info',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const showFlash = useCallback(
    (type: FlashType, title: string, message: string, duration = 5000) => {
      const method = typeToSileo[type];
      setTimeout(() => sileo[method]({ title, description: message, duration }), 0);
    },
    []
  );

  const dismissFlash = useCallback((_id: number) => {
    // sileo manages dismissals automatically; kept for API compatibility
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      const flashType: FlashType =
        type === 'error'
          ? 'alert'
          : type === 'warning'
            ? 'alert'
            : type === 'success'
              ? 'success'
              : 'info';
      const titleMap: Record<string, string> = {
        success: 'Éxito',
        error: 'Error',
        info: 'Información',
        warning: 'Advertencia',
      };
      showFlash(flashType, titleMap[type] || 'Notificación', message);
    },
    [showFlash]
  );

  return (
    <ToastContext.Provider value={{ notifications: [], showFlash, dismissFlash, showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
