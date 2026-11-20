"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({ tabs, initial, onChange }: { tabs: Tab[]; initial?: string; onChange?: (id: string) => void }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  return (
    <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => { setActive(t.id); onChange?.(t.id); }}
            className={`relative px-4 py-2.5 text-[0.84rem] whitespace-nowrap transition-colors ${
              isActive
                ? "text-[var(--brand-700)] font-semibold"
                : "text-[var(--text-muted)] font-medium hover:text-[var(--text)]"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                isActive ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "bg-[var(--slate-100)] text-[var(--text-muted)]"
              }`}>
                {t.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[var(--brand-600)] rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-[1.05rem] font-semibold text-[var(--text)] tracking-tight">{title}</h2>
        {subtitle && <p className="text-[0.83rem] text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
