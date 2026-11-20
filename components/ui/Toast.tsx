"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const STYLE: Record<ToastVariant, { icon: string; color: string; bg: string }> = {
  success: { icon: "CheckCircle2", color: "var(--success)", bg: "var(--success-bg)" },
  error: { icon: "AlertCircle", color: "var(--danger)", bg: "var(--danger-bg)" },
  info: { icon: "Info", color: "var(--info)", bg: "var(--info-bg)" },
};

/** Lightweight toast stack; mounted once at the root of the app. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (message) => toast(message, "success"),
      error: (message) => toast(message, "error"),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
        {items.map((item) => {
          const style = STYLE[item.variant];
          return (
            <div key={item.id} className="card fade-in pointer-events-auto flex items-start gap-3 p-3.5 pr-3">
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: style.bg }}
              >
                <Icon name={style.icon} size={16} style={{ color: style.color }} />
              </span>
              <p className="flex-1 pt-0.5 text-[0.83rem] leading-relaxed text-[var(--text)]">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss"
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-[var(--surface-2)]"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
