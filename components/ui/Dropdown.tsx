"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

/** Minimal click-outside dropdown used for row actions. */
export function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: (api: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div
          className={`card fade-in absolute z-40 mt-1 min-w-[190px] p-1.5 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  icon,
  children,
  onClick,
  danger,
  disabled,
}: {
  icon: string;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[0.82rem] transition-colors disabled:opacity-40 ${
        danger
          ? "text-[var(--danger)] hover:bg-[var(--danger-bg)]"
          : "text-[var(--text)] hover:bg-[var(--surface-2)]"
      }`}
    >
      <Icon name={icon} size={15} className="flex-shrink-0" />
      {children}
    </button>
  );
}

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[0.82rem] text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]";

/** Navigation item — rendered as a link so it stays keyboard friendly. */
export function DropdownLink({
  icon,
  href,
  children,
  onClick,
}: {
  icon: string;
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={ITEM_CLASS}>
      <Icon name={icon} size={15} className="flex-shrink-0" />
      {children}
    </Link>
  );
}
