"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ReportsPage() {
  const cards = [
    { t: "Attendance Report", d: "Employee attendance summary", i: "Fingerprint" },
    { t: "Leave Report", d: "Leave usage and balance", i: "CalendarDays" },
    { t: "Payroll Report", d: "Salary and payout details", i: "Wallet" },
    { t: "Headcount Report", d: "Department-wise headcount", i: "Users" },
    { t: "Performance Report", d: "Employee performance metrics", i: "TrendingUp" },
    { t: "Time Off Report", d: "Time off trends and approvals", i: "Clock3" },
  ];
  return (
    <div>
      <PageHeader title="Reports" subtitle="Analytics and insights across modules" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.t} className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-11 w-11 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center mb-3">
              <Icon name={c.i} size={21} />
            </div>
            <h3 className="font-semibold text-[var(--text)]">{c.t}</h3>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{c.d}</p>
            <button className="mt-3 text-xs font-semibold text-[var(--brand-600)] inline-flex items-center gap-1">
              View report <Icon name="ArrowUpRight" size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
