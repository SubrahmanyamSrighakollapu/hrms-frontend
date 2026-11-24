"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { getStats, type ExpenseStats } from "@/lib/expenses";
import { formatMoney } from "./labels";
import { ExpenseClaimsPanel } from "./ExpenseClaimsPanel";
import { ExpenseApprovalsPanel } from "./ExpenseApprovalsPanel";
import { ExpenseReportPanel } from "./ExpenseReportPanel";
import { ExpenseCategoriesPanel } from "./ExpenseCategoriesPanel";

type TabId = "claims" | "approvals" | "report" | "categories";

export function ExpenseModulePage() {
  const { can } = useAuth();
  const canManage = can("expenses", "MANAGE");
  const [tab, setTab] = useState<TabId>("claims");
  const [stats, setStats] = useState<ExpenseStats | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const tabs = useMemo(() => {
    const list = [{ id: "claims", label: "Claims" }];
    if (canManage) list.push({ id: "approvals", label: "Approvals" });
    list.push({ id: "report", label: "Reports" });
    if (canManage) list.push({ id: "categories", label: "Categories" });
    return list;
  }, [canManage]);

  const cards = [
    { label: "Total claims", value: stats ? String(stats.total) : "—", icon: "Receipt" },
    { label: "Claimed amount", value: stats ? formatMoney(stats.claimedAmount) : "—", icon: "Wallet" },
    { label: "Reimbursed", value: stats ? formatMoney(stats.reimbursedAmount) : "—", icon: "Banknote" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Expenses" subtitle="Submit claims, track approvals and reimbursements" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-50)]">
              <Icon name={card.icon} size={19} className="text-[var(--brand-700)]" />
            </span>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{card.label}</div>
              <div className="mt-0.5 truncate text-xl font-bold text-[var(--text)]">{card.value}</div>
            </div>
          </div>
        ))}
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--warning-bg)]">
            <Icon name="Clock3" size={19} className="text-[var(--warning)]" />
          </span>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Pending approval</div>
            <div className="mt-0.5 text-xl font-bold text-[var(--text)]">{stats ? stats.pendingApprovals : "—"}</div>
            {canManage && stats && stats.pendingReimbursement > 0 && (
              <div className="text-[0.7rem] text-[var(--text-subtle)]">{stats.pendingReimbursement} awaiting reimbursement</div>
            )}
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} initial="claims" onChange={(id) => setTab(id as TabId)} />

      {tab === "claims" && <ExpenseClaimsPanel canManage={canManage} />}
      {tab === "approvals" && canManage && <ExpenseApprovalsPanel />}
      {tab === "report" && <ExpenseReportPanel canManage={canManage} />}
      {tab === "categories" && canManage && <ExpenseCategoriesPanel />}
    </div>
  );
}
