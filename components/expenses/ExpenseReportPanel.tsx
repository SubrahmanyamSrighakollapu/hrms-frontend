"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { TablePagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  exportReport,
  getReport,
  listCategories,
  listReportEmployees,
  type ExpenseCategory,
  type ExpenseClaim,
  type ExpenseReportSummary,
  type ExpenseStatus,
  type ReportEmployee,
} from "@/lib/expenses";
import { STATUS_LABEL, STATUS_ORDER, STATUS_TONE, formatDate, formatMoney, saveBlob } from "./labels";

const SUMMARY_CARDS: { key: keyof ExpenseReportSummary; label: string; money: boolean }[] = [
  { key: "claimedAmount", label: "Claimed", money: true },
  { key: "approvedAmount", label: "Approved", money: true },
  { key: "reimbursedAmount", label: "Reimbursed", money: true },
];

export function ExpenseReportPanel({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<ExpenseStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [employees, setEmployees] = useState<ReportEmployee[]>([]);

  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [summary, setSummary] = useState<ExpenseReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const filters = useCallback(
    () => ({
      from: from || undefined,
      to: to || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
      employeeId: employeeId || undefined,
    }),
    [from, to, status, categoryId, employeeId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getReport({ ...filters(), page, pageSize });
      setClaims(result.claims);
      setSummary(result.summary);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the report");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    if (canManage) {
      listReportEmployees()
        .then(setEmployees)
        .catch(() => setEmployees([]));
    }
  }, [canManage]);

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setStatus("");
    setCategoryId("");
    setEmployeeId("");
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportReport(filters());
      saveBlob(blob, `expense-report-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Report exported as CSV");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not export the report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <label className="text-xs font-medium text-[var(--text-muted)]">
          From
          <Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="mt-1 block w-40" />
        </label>
        <label className="text-xs font-medium text-[var(--text-muted)]">
          To
          <Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="mt-1 block w-40" />
        </label>
        <label className="text-xs font-medium text-[var(--text-muted)]">
          Status
          <Select value={status} onChange={(event) => { setStatus(event.target.value as ExpenseStatus | ""); setPage(1); }} className="mt-1 block w-40">
            <option value="">All (excluding draft)</option>
            {STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-medium text-[var(--text-muted)]">
          Category
          <Select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} className="mt-1 block w-44">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>
        {canManage && (
          <label className="text-xs font-medium text-[var(--text-muted)]">
            Employee
            <Select value={employeeId} onChange={(event) => { setEmployeeId(event.target.value); setPage(1); }} className="mt-1 block w-48">
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name ?? employee.email}
                </option>
              ))}
            </Select>
          </label>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={resetFilters} className="btn-ghost h-9 px-3 text-[0.84rem]">
            Reset
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary inline-flex h-9 items-center gap-2 px-3.5 text-[0.84rem] disabled:opacity-60"
          >
            {exporting ? <Icon name="RefreshCw" size={15} className="animate-spin" /> : <Icon name="Download" size={15} />}
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={15} /> {error}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="card p-4">
              <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Claims</div>
              <div className="mt-0.5 text-2xl font-bold text-[var(--text)]">{summary.totalClaims}</div>
            </div>
            {SUMMARY_CARDS.map((card) => (
              <div key={card.key} className="card p-4">
                <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{card.label}</div>
                <div className="mt-0.5 text-2xl font-bold text-[var(--text)]">
                  {formatMoney(summary[card.key] as number)}
                </div>
              </div>
            ))}
          </div>

          {summary.byCategory.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
                Spend by category
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--slate-50)]">
                    <tr className="text-left text-xs text-[var(--text-muted)]">
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 text-right font-medium">Claims</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byCategory.map((row) => (
                      <tr key={row.categoryId} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 text-[var(--text)]">{row.categoryName}</td>
                        <td className="px-4 py-3 text-right text-[var(--text-muted)]">{row.count}</td>
                        <td className="px-4 py-3 text-right font-medium text-[var(--text)]">{formatMoney(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)]">
          Claim detail
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Loading report…
                  </td>
                </tr>
              )}

              {!loading &&
                claims.map((claim) => (
                  <tr key={claim.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{claim.code}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{claim.employeeName ?? claim.employeeEmail}</td>
                    <td className="px-4 py-3 text-[var(--text)]">{claim.title}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(claim.submittedAt ?? claim.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[claim.status]}>{STATUS_LABEL[claim.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--text)]">
                      {formatMoney(claim.totalAmount, claim.currency)}
                    </td>
                  </tr>
                ))}

              {!loading && claims.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="BarChart3" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    No claims match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          loading={loading}
          label="claims"
        />
      </div>
    </div>
  );
}
