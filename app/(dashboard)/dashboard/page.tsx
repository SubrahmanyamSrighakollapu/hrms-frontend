"use client";

import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { dashboardVariant } from "@/lib/rbac";
import { AdminDashboard } from "./_components/AdminDashboard";
import { HrDashboard } from "./_components/HrDashboard";
import { EmployeeDashboard } from "./_components/EmployeeDashboard";

export default function DashboardPage() {
  const { user, role, permissions } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const variant = dashboardVariant(role, permissions);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--brand-600)]">
              {role?.name ?? "Employee"} workspace
            </span>
            <h2 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-[var(--text)]">
              Good day, {firstName}
            </h2>
            <p className="text-[0.85rem] text-[var(--text-muted)] mt-1">
              Here is your workspace overview for today.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.8rem] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> 231 present today
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="Clock3" size={14} className="text-[var(--text-subtle)]" /> 18 approvals waiting
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="Zap" size={14} className="text-[var(--text-subtle)]" /> Payroll run in 4 days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button className="btn-primary h-10 px-4 text-[0.84rem] flex items-center gap-2">
              <Icon name="Plus" size={16} /> New request
            </button>
            <button className="btn-ghost h-10 px-4 text-[0.84rem] flex items-center gap-2">
              <Icon name="Download" size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {variant === "admin" && <AdminDashboard />}
      {variant === "hr" && <HrDashboard />}
      {variant === "employee" && <EmployeeDashboard />}
    </div>
  );
}
