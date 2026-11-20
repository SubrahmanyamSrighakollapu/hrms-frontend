"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "./StatCard";
import { useAuth } from "@/lib/auth-context";
import type { DashboardSummary } from "@/lib/dashboard";

function formatDate(value: string | null) {
  if (!value) return "Date not set";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function requestLabel(request: DashboardSummary["recentRequests"][number]) {
  if (request.leaveType) return `${request.leaveType.replaceAll("_", " ")} leave`;
  return request.type.replaceAll("_", " ").toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
}

export function DashboardView({ data }: { data: DashboardSummary }) {
  const { can } = useAuth();
  const organizationView = data.employees !== null;
  const balances = data.leaveBalances;
  const remainingDays = balances.reduce((sum, balance) => sum + balance.remaining, 0);
  const pendingMine = data.recentRequests.filter((request) => request.status === "PENDING").length;
  const maxDepartment = Math.max(1, ...data.departments.map((department) => department.activeEmployees));

  const cards = organizationView
    ? [
        { label: "Active employees", value: data.employees?.active ?? 0, icon: "Users", accent: "brand" as const },
        ...(data.pendingApprovals
          ? [{ label: "Pending approvals", value: data.pendingApprovals.total, icon: "Clock3", accent: "warning" as const }]
          : []),
        ...(data.approvedLeaveToday !== null
          ? [{ label: "On approved leave today", value: data.approvedLeaveToday, icon: "CalendarDays", accent: "info" as const }]
          : []),
        ...(data.currentPeriodPayslips !== null
          ? [{ label: `Payslips uploaded · ${data.currentPeriod}`, value: data.currentPeriodPayslips, icon: "Wallet", accent: "success" as const }]
          : []),
      ]
    : [
        { label: "Available leave days", value: remainingDays, icon: "CalendarDays", accent: "brand" as const },
        { label: "Pending requests", value: pendingMine, icon: "Clock3", accent: "warning" as const },
        ...(data.currentPeriodPayslips !== null
          ? [{ label: "Payslips available", value: data.currentPeriodPayslips, icon: "Wallet", accent: "success" as const }]
          : []),
      ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} accent={card.accent} />
        ))}
      </div>

      {organizationView ? (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <section className="card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text)]">Pending approvals</h3>
                {can("time-off", "MANAGE") && (
                  <Link href="/time-off/approvals" className="text-xs font-semibold text-[var(--brand-600)]">
                    Open inbox
                  </Link>
                )}
              </div>
              {data.pendingApprovals?.requests.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-subtle)]">
                        <th className="pb-2 font-medium">Employee</th>
                        <th className="pb-2 font-medium">Request</th>
                        <th className="pb-2 font-medium">Dates</th>
                        <th className="pb-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pendingApprovals.requests.map((request) => (
                        <tr key={request.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-3 font-medium text-[var(--text)]">{request.employeeName}</td>
                          <td className="py-3 text-[var(--text-muted)]">
                            {request.leaveType ?? request.type.replaceAll("_", " ")}
                          </td>
                          <td className="py-3 text-[var(--text-muted)]">
                            {request.fromDate ? `${formatDate(request.fromDate)} – ${formatDate(request.toDate)}` : `${request.days ?? "—"} day(s)`}
                          </td>
                          <td className="py-3 text-right"><span className="badge badge-warning">Pending</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-[var(--text-muted)]">No pending requests for your role.</p>
              )}
            </section>

            <section className="card p-5">
              <h3 className="mb-4 font-semibold text-[var(--text)]">Active headcount by department</h3>
              {data.departments.length ? (
                <div className="space-y-4">
                  {data.departments.map((department) => (
                    <div key={department.id}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-medium text-[var(--text)]">{department.name}</span>
                        <span className="text-[var(--text-muted)]">{department.activeEmployees}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--slate-100)]">
                        <div
                          className="h-full rounded-full bg-[var(--brand-600)]"
                          style={{ width: `${(department.activeEmployees / maxDepartment) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[var(--text-muted)]">No departments have been created.</p>
              )}
            </section>
          </div>

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text)]">New joiners this month</h3>
              {can("employees") && <Link href="/employees" className="text-xs font-semibold text-[var(--brand-600)]">Employee directory</Link>}
            </div>
            {data.recentEmployees.length ? (
              <div className="divide-y divide-[var(--border)]">
                {data.recentEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-50)] text-xs font-bold text-[var(--brand-700)]">
                      {employee.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text)]">{employee.name}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {[employee.designation, employee.department].filter(Boolean).join(" · ") || "Role not set"}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-subtle)]">{formatDate(employee.joinedAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">No employees joined this month.</p>
            )}
          </section>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text)]">Leave balances</h3>
              {can("time-off") && <Link href="/time-off/leaves" className="text-xs font-semibold text-[var(--brand-600)]">View requests</Link>}
            </div>
            {balances.length ? (
              <div className="space-y-4">
                {balances.map((balance) => (
                  <div key={balance.leaveType}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">{balance.leaveType.replaceAll("_", " ")}</span>
                      <span className="font-medium text-[var(--text)]">{balance.remaining} / {balance.total} days</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--slate-100)]">
                      <div
                        className="h-full rounded-full bg-[var(--brand-500)]"
                        style={{ width: `${balance.total ? Math.min(100, (balance.used / balance.total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">No leave balances are configured for this year.</p>
            )}
          </section>

          <section className="card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text)]">Recent time-off requests</h3>
              {can("time-off") && <Link href="/time-off" className="text-xs font-semibold text-[var(--brand-600)]">Open Time Off</Link>}
            </div>
            {data.recentRequests.length ? (
              <div className="divide-y divide-[var(--border)]">
                {data.recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{requestLabel(request)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(request.fromDate ?? request.requestDate)}{request.toDate ? ` – ${formatDate(request.toDate)}` : ""}</p>
                    </div>
                    <span className={`badge ${request.status === "APPROVED" ? "badge-success" : request.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                      {request.status.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">You haven’t submitted a request yet.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
              {[
                { label: "Apply for leave", href: "/time-off/leaves", icon: "CalendarDays" },
                { label: "Request permission", href: "/time-off/permissions", icon: "Clock" },
                { label: "Log extra hours", href: "/time-off/extra-hours", icon: "Timer" },
              ].filter(() => can("time-off")).map((item) => (
                <Link key={item.href} href={item.href} className="btn-ghost inline-flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-xs">
                  <Icon name={item.icon} size={14} />{item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
