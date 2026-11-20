import { Icon } from "@/components/ui/Icon";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: string; up: boolean };
  accent?: string; // tailwind-ish color key mapped via inline style
}

const ACCENTS: Record<string, { bg: string; fg: string }> = {
  brand: { bg: "var(--brand-50)", fg: "var(--brand-700)" },
  success: { bg: "var(--success-bg)", fg: "var(--success)" },
  warning: { bg: "var(--warning-bg)", fg: "var(--warning)" },
  info: { bg: "var(--info-bg)", fg: "var(--info)" },
  danger: { bg: "var(--danger-bg)", fg: "var(--danger)" },
};

export function StatCard({ label, value, icon, trend, accent = "brand" }: StatCardProps) {
  const a = ACCENTS[accent] ?? ACCENTS.brand;
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.bg, color: a.fg }}>
        <Icon name={icon} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-[var(--text)] mt-0.5">{value}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs mt-0.5 ${trend.up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            <Icon name={trend.up ? "ArrowUpRight" : "ArrowDownRight"} size={13} />
            <span className="font-semibold">{trend.value}</span>
            <span className="text-[var(--text-subtle)]">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
