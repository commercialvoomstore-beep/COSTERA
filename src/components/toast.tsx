'use client';

// COSTERA — Notifications éphémères (toasts) : contexte + conteneur.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const I = Icon[t.kind];
          return (
            <div key={t.id} className={`toast toast-${t.kind}`} role="status">
              <I className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                aria-label="Fermer la notification"
                className="opacity-70 transition hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
