"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

/**
 * Right-hand slide-over panel.
 *
 * Used for the employee creation popup and every edit form that follows, so
 * the form never navigates away from the list it was opened from.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  size?: "md" | "lg";
  children: ReactNode;
}) {
  const portalTarget = useSyncExternalStore(
    () => () => {},
    () => document.body,
    () => null,
  );

  // Close on Escape and freeze the page behind the panel while it is open.
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

  if (!open || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 overlay-in" onClick={onClose} />

      <aside
        className={`relative flex h-full w-full flex-col bg-[var(--surface)] drawer-in ${
          size === "lg" ? "max-w-[720px]" : "max-w-[540px]"
        }`}
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[1rem] font-semibold text-[var(--text)]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[0.8rem] text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-subtle)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Icon name="X" size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-4">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    portalTarget,
  );
}
