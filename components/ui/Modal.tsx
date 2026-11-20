"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

type ModalTone = "brand" | "danger" | "warning" | "success";

const TONE: Record<ModalTone, { bg: string; color: string; icon: string }> = {
  brand: { bg: "var(--brand-50)", color: "var(--brand-700)", icon: "Info" },
  danger: { bg: "var(--danger-bg)", color: "var(--danger)", icon: "AlertCircle" },
  warning: { bg: "var(--warning-bg)", color: "var(--warning)", icon: "AlertCircle" },
  success: { bg: "var(--success-bg)", color: "var(--success)", icon: "CheckCircle2" },
};

/** Centered dialog for confirmations and short forms. */
export function Modal({
  open,
  onClose,
  title,
  description,
  tone = "brand",
  icon,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: ModalTone;
  icon?: string;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const style = TONE[tone];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 overlay-in" onClick={onClose} />
      <div className="card fade-in relative w-full max-w-md p-6" style={{ boxShadow: "var(--shadow-lg)" }}>
        <div className="flex items-start gap-3.5">
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: style.bg }}
          >
            <Icon name={icon ?? style.icon} size={19} style={{ color: style.color }} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[0.98rem] font-semibold text-[var(--text)]">{title}</h3>
            {description && <p className="mt-1 text-[0.83rem] leading-relaxed text-[var(--text-muted)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-subtle)] hover:bg-[var(--surface-2)]"
          >
            <Icon name="X" size={15} />
          </button>
        </div>

        {children && <div className="mt-4">{children}</div>}

        {footer && <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
