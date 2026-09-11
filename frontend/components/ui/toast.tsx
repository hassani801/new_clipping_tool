'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const TOAST_STYLES: Record<ToastType, { icon: React.ReactNode; accent: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    accent: 'border-emerald-500/30',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    accent: 'border-rose-500/30',
  },
  info: {
    icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    accent: 'border-sky-500/30',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = TOAST_STYLES[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'pointer-events-auto flex items-start gap-2.5 rounded-xl bg-[#1C1C22] border p-3 shadow-2xl shadow-black/60',
                  style.accent,
                )}
              >
                <span className="mt-0.5">{style.icon}</span>
                <p className="flex-1 text-xs text-[#F5F5F7] leading-relaxed">
                  {t.message}
                </p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-[#71717A] hover:text-[#F5F5F7] transition shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
