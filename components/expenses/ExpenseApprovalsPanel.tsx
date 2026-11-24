"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { TablePagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { getClaim, listClaims, type ExpenseClaim, type ExpenseStatus } from "@/lib/expenses";
import { STATUS_LABEL, STATUS_TONE, formatDate, formatMoney } from "./labels";
import { ClaimDetailDrawer } from "./ClaimDetailDrawer";

const APPROVAL_ORDER: ExpenseStatus[] = ["SUBMITTED", "APPROVED", "REIMBURSED", "CLARIFICATION", "REJECTED"];

export function ExpenseApprovalsPanel() {
  const toast = useToast();
  const [status, setStatus] = useState<ExpenseStatus | "">("SUBMITTED");
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ExpenseClaim | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listClaims({
        scope: status === "SUBMITTED" ? "approvals" : "all",
        status: status || undefined,
        page,
        pageSize,
      });
      setClaims(result.claims);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the approval queue");
    } finally {
      setLoading(false);
    }
  }, [status, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (claim: ExpenseClaim) => {
    setSelected(claim);
    try {
      setSelected(await getClaim(claim.id));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not load the claim");
    }
  };

  const handleUpdated = (claim: ExpenseClaim) => {
    setSelected((current) => (current && current.id === claim.id ? claim : current));
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExpenseStatus | "");
            setPage(1);
          }}
          className="h-9 w-44 text-sm"
        >
          <option value="">All statuses</option>
          {APPROVAL_ORDER.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
        <span className="text-xs text-[var(--text-muted)]">
          {status === "SUBMITTED" ? "Claims awaiting a decision" : "Review and manage every claim"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={15} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Claim</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Loading the approval queue…
                  </td>
                </tr>
              )}

              {!loading &&
                claims.map((claim) => (
                  <tr key={claim.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text)]">{claim.employeeName ?? claim.employeeEmail}</div>
                      <div className="text-xs text-[var(--text-muted)]">{claim.employeeEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[var(--text)]">{claim.title}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {claim.code} · {claim.itemCount} line{claim.itemCount === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(claim.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[claim.status]}>{STATUS_LABEL[claim.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--text)]">
                      {formatMoney(claim.totalAmount, claim.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(claim)}
                        className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
                      >
                        <Icon name={claim.status === "SUBMITTED" ? "CheckCircle2" : "Eye"} size={13} />
                        {claim.status === "SUBMITTED" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && claims.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="CheckCircle2" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    Nothing pending in this view.
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

      <ClaimDetailDrawer
        claim={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        canManage
        isOwner={false}
        onUpdated={handleUpdated}
        onDeleted={() => {
          setSelected(null);
          void load();
        }}
        onEditRequest={() => undefined}
      />
    </div>
  );
}
