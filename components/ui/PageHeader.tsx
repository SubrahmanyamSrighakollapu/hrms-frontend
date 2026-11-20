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
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => { setActive(t.id); onChange?.(t.id); }}
          className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
            active === t.id ? "text-[var(--brand-700)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold ${
              active === t.id ? "bg-[var(--brand-700)] text-white" : "bg-[var(--slate-100)] text-[var(--text-muted)]"
            }`}>{t.count}</span>
          )}
          {active === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-700)] rounded-full" />}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-lg font-bold text-[var(--text)]">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
