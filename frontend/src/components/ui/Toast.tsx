import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string, action?: ToastMessage['action']) => void;
  warning: (title: string, description?: string, action?: ToastMessage['action']) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, description, action, duration = 4500 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, title, description, action, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ type: 'success', title, description }),
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string, action?: ToastMessage['action']) =>
      toast({ type: 'error', title, description, action, duration: 6000 }),
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string, action?: ToastMessage['action']) =>
      toast({ type: 'warning', title, description, action, duration: 6000 }),
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => toast({ type: 'info', title, description }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-2 sm:p-0"
      >
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-white shadow-flyout text-brand-primary',
                item.type === 'success' && 'border-green-200 bg-white',
                item.type === 'error' && 'border-red-200 bg-white',
                item.type === 'warning' && 'border-amber-200 bg-white',
                item.type === 'info' && 'border-brand-border bg-white'
              )}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-brand-success" />
                )}
                {item.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-brand-error" />
                )}
                {item.type === 'warning' && (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
                {item.type === 'info' && (
                  <Info className="w-5 h-5 text-brand-accent" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-primary">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-brand-secondary break-words leading-relaxed">
                    {item.description}
                  </p>
                )}
                {item.action && (
                  <button
                    type="button"
                    onClick={() => {
                      item.action?.onClick();
                      dismiss(item.id);
                    }}
                    className="mt-2 text-xs font-semibold text-brand-accent hover:text-brand-accentHover underline underline-offset-2"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 text-brand-muted hover:text-brand-primary p-0.5 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
