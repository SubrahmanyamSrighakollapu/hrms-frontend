"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const sections = [
    { t: "General", d: "Organization name, logo, timezone", i: "Settings" },
    { t: "Leave Policies", d: "Leave types, entitlements, approvals", i: "CalendarDays" },
    { t: "Payroll Settings", d: "Pay cycles, allowances, deductions", i: "Wallet" },
    { t: "Roles & Permissions", d: "Access control for modules", i: "Users" },
    { t: "Notifications", d: "Email, in-app, push preferences", i: "Bell" },
    { t: "Integrations", d: "Connect third-party services", i: "Network" },
  ];
  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your workspace" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s.t} className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-11 w-11 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center mb-3">
              <Icon name={s.i} size={21} />
            </div>
            <h3 className="font-semibold text-[var(--text)]">{s.t}</h3>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
