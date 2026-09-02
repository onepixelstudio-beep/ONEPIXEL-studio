import { useState } from 'react';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  return {
    toasts,
    showToast,
    setToasts
  };
}
