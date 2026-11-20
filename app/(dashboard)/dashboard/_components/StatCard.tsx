import { Icon } from "@/components/ui/Icon";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: string; up: boolean };
  accent?: "brand" | "success" | "warning" | "info" | "danger";
  spark?: number[];
}

const TONES: Record<string, { bg: string; fg: string }> = {
  brand: { bg: "var(--brand-50)", fg: "var(--brand-600)" },
  success: { bg: "var(--success-bg)", fg: "var(--success)" },
  warning: { bg: "var(--warning-bg)", fg: "var(--warning)" },
  info: { bg: "var(--info-bg)", fg: "var(--info)" },
  danger: { bg: "var(--danger-bg)", fg: "var(--danger)" },
};

/** Build a smooth sparkline path from a series of values. */
function sparkPath(data: number[], w = 88, h = 28) {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  return data
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((v - min) / span) * (h - 6) - 3).toFixed(1)}`)
    .join(" ");
}

export function StatCard({ label, value, icon, trend, accent = "brand", spark }: StatCardProps) {
  const t = TONES[accent] ?? TONES.brand;
  const path = spark ? sparkPath(spark) : "";

  return (
    <div className="card card-hover p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-subtle)]">
          {label}
        </span>
        <span
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: t.bg, color: t.fg }}
        >
          <Icon name={icon} size={16} />
        </span>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[1.5rem] font-semibold tracking-tight text-[var(--text)] leading-none">{value}</div>
          {trend && (
            <div
              className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-medium"
              style={{ color: trend.up ? "var(--success)" : "var(--danger)" }}
            >
              <Icon name={trend.up ? "TrendingUp" : "TrendingDown"} size={12} />
              {trend.value}
            </div>
          )}
        </div>

        {path && (
          <svg width="88" height="28" viewBox="0 0 88 28" className="flex-shrink-0" fill="none">
            <path d={`${path} L88,28 L0,28 Z`} fill={t.fg} opacity="0.08" />
            <path d={path} stroke={t.fg} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
          </svg>
        )}
      </div>
    </div>
  );
}
