"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";

const REQUESTS = [
  { id: 1, type: "Casual Leave", from: "Nov 22", to: "Nov 23", days: 2, status: "Approved", applied: "Nov 18" },
  { id: 2, type: "Work From Home", from: "Nov 20", to: "Nov 20", days: 1, status: "Pending", applied: "Nov 19" },
  { id: 3, type: "Permission", from: "Nov 18", to: "Nov 18", days: 0.5, status: "Approved", applied: "Nov 17" },
  { id: 4, type: "Sick Leave", from: "Nov 10", to: "Nov 11", days: 2, status: "Rejected", applied: "Nov 09" },
  { id: 5, type: "Comp-off", from: "Nov 05", to: "Nov 05", days: 1, status: "Processed", applied: "Nov 03" },
];

const STATUS_STYLE: Record<string, string> = {
  Approved: "badge-success",
  Pending: "badge-warning",
  Rejected: "badge-danger",
  Processed: "badge-info",
};

export default function TimeOffPage() {
  const [tab, setTab] = useState("leaves");
  return (
    <div>
      <PageHeader
        title="Time Off"
        subtitle="Apply for leaves, permissions, and track your requests"
        actions={
          <>
            <button className="btn-ghost border border-[var(--border)] px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm">
              <Icon name="Filter" size={15} /> Filter
            </button>
            <button className="btn-primary px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm">
              <Icon name="Plus" size={15} /> New Request
            </button>
          </>
        }
      />

      {/* Balance cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { n: "Casual", v: "8 / 12", c: "var(--brand-500)" },
          { n: "Sick", v: "7 / 8", c: "var(--success)" },
          { n: "Earned", v: "6 / 6", c: "var(--warning)" },
          { n: "Comp-off", v: "2 / 3", c: "var(--info)" },
        ].map((b) => (
          <div key={b.n} className="card p-3.5">
            <div className="text-xs text-[var(--text-muted)] font-medium">{b.n} Leave</div>
            <div className="text-lg font-bold text-[var(--text)] mt-1">{b.v}</div>
            <div className="h-1.5 rounded-full bg-[var(--slate-100)] mt-2 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "60%", background: b.c }} />
            </div>
          </div>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: "leaves", label: "Leaves", count: 3 },
          { id: "permissions", label: "Permissions" },
          { id: "regularization", label: "Regularization" },
          { id: "extra-hours", label: "Extra Hours" },
          { id: "comp-off", label: "Comp-off" },
          { id: "wfh", label: "Work From Home" },
        ]}
      />

      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Days</th>
                <th className="px-4 py-3 font-medium">Applied On</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {REQUESTS.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--slate-50)]">
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{r.type}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{r.from}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{r.to}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{r.days}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{r.applied}</td>
                  <td className="px-4 py-3"><span className={`badge ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button className="h-7 w-7 rounded-md text-[var(--text-muted)] hover:bg-[var(--slate-100)] inline-flex items-center justify-center">
                      <Icon name="MoreVertical" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
