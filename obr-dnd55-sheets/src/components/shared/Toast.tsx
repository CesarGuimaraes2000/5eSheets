import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cx } from './ui';

export type ToastTone = 'info' | 'success' | 'error';
interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

/** Minimal in-app toast used by both modes. */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = toast ? (
    <div
      key={toast.id}
      role="status"
      className={cx(
        'animate-fade-in fixed bottom-4 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-2xl backdrop-blur',
        toast.tone === 'success' && 'border-life-500/50 bg-ink-900/95 text-life-400',
        toast.tone === 'error' && 'border-blood-500/50 bg-ink-900/95 text-blood-400',
        toast.tone === 'info' && 'border-ink-600 bg-ink-900/95 text-ink-100',
      )}
    >
      {toast.tone === 'success' && <CheckCircle2 className="h-4 w-4" />}
      {toast.tone === 'error' && <AlertTriangle className="h-4 w-4" />}
      {toast.tone === 'info' && <Info className="h-4 w-4" />}
      {toast.message}
    </div>
  ) : null;

  return { show, node };
}
