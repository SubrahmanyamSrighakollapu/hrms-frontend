"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { dashboardVariant } from "@/lib/rbac";
import { getDashboardSummary, type DashboardSummary } from "@/lib/dashboard";
import { AdminDashboard } from "./_components/AdminDashboard";
import { HrDashboard } from "./_components/HrDashboard";
import { EmployeeDashboard } from "./_components/EmployeeDashboard";

export default function DashboardPage() {
  const { user, role, permissions, can } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const variant = dashboardVariant(role, permissions);

  useEffect(() => {
    let active = true;
    getDashboardSummary()
      .then((summary) => {
        if (active) {
          setData(summary);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load dashboard data");
      });
    return () => {
      active = false;
    };
  }, [retry]);

  return (
    <div className="space-y-5">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--brand-600)]">
              {role?.name ?? "Employee"} workspace
            </span>
            <h2 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-[var(--text)]">
              Welcome, {firstName}
            </h2>
            <p className="text-[0.85rem] text-[var(--text-muted)] mt-1">
              Your overview is built from current HRMS records.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {can("time-off") && (
              <Link href="/time-off/leaves" className="btn-primary inline-flex h-10 items-center gap-2 px-4 text-[0.84rem]">
                <Icon name="Plus" size={16} /> New request
              </Link>
            )}
            {can("reports") && (
              <Link href="/reports" className="btn-ghost inline-flex h-10 items-center gap-2 px-4 text-[0.84rem]">
                <Icon name="BarChart3" size={16} /> Reports
              </Link>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-[var(--text)]">Dashboard data could not be loaded</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
          <button onClick={() => setRetry((value) => value + 1)} className="btn-primary mt-4 px-4 py-2 text-sm">
            Try again
          </button>
        </div>
      ) : !data ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading your workspace data…</div>
      ) : variant === "admin" ? (
        <AdminDashboard data={data} />
      ) : variant === "hr" ? (
        <HrDashboard data={data} />
      ) : (
        <EmployeeDashboard data={data} />
      )}
    </div>
  );
}
