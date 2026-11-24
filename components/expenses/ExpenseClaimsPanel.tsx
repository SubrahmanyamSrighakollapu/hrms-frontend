"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { TablePagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  getClaim,
  listCategories,
  listClaims,
  type ExpenseCategory,
  type ExpenseClaim,
  type ExpenseStatus,
} from "@/lib/expenses";
import { STATUS_LABEL, STATUS_ORDER, STATUS_TONE, formatDate, formatMoney, isEditable } from "./labels";
import { ExpenseClaimFormModal } from "./ExpenseClaimFormModal";
import { ClaimDetailDrawer } from "./ClaimDetailDrawer";

export function ExpenseClaimsPanel({ canManage }: { canManage: boolean }) {
  const { user } = useAuth();
  const toast = useToast();

  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [status, setStatus] = useState<ExpenseStatus | "">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState<ExpenseClaim | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseClaim | null>(null);

  // Debounce the search box so typing does not hammer the API.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listClaims({
        scope: canManage ? scope : "mine",
        status: status || undefined,
        q: query || undefined,
        page,
        pageSize,
      });
      setClaims(result.claims);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load expense claims");
    } finally {
      setLoading(false);
    }
  }, [canManage, scope, status, query, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const openDetail = async (claim: ExpenseClaim) => {
    setSelected(claim);
    try {
      setSelected(await getClaim(claim.id));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not load the claim");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (claim: ExpenseClaim) => {
    setEditing(claim);
    setFormOpen(true);
  };

  const handleSaved = (claim: ExpenseClaim) => {
    setFormOpen(false);
    setEditing(null);
    setSelected((current) => (current && current.id === claim.id ? claim : current));
    void load();
  };

  const handleUpdated = (claim: ExpenseClaim) => {
    setSelected(claim);
    setClaims((list) => list.map((row) => (row.id === claim.id ? claim : row)));
  };

  const handleDeleted = (id: string) => {
    setSelected(null);
    setClaims((list) => list.filter((row) => row.id !== id));
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <Select
            value={scope}
            onChange={(event) => {
              setScope(event.target.value as "mine" | "all");
              setPage(1);
            }}
            className="h-9 w-40 text-sm"
          >
            <option value="mine">My claims</option>
            <option value="all">All claims</option>
          </Select>
        )}
        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExpenseStatus | "");
            setPage(1);
          }}
          className="h-9 w-44 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
        <div className="relative">
          <Icon name="Search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search code or title"
            className="h-9 w-56 pl-9 text-sm"
          />
        </div>
        <button type="button" onClick={openCreate} className="btn-primary ml-auto inline-flex h-9 items-center gap-2 px-3.5 text-sm">
          <Icon name="Plus" size={16} /> New claim
        </button>
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
                <th className="px-4 py-3 font-medium">Claim</th>
                {canManage && scope === "all" && <th className="px-4 py-3 font-medium">Employee</th>}
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
                    Loading claims…
                  </td>
                </tr>
              )}

              {!loading &&
                claims.map((claim) => {
                  const owner = !!user && claim.employeeId === user.id;
                  return (
                    <tr key={claim.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => openDetail(claim)} className="text-left">
                          <div className="font-medium text-[var(--text)]">{claim.title}</div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {claim.code} · {claim.itemCount} line{claim.itemCount === 1 ? "" : "s"}
                          </div>
                        </button>
                      </td>
                      {canManage && scope === "all" && (
                        <td className="px-4 py-3 text-[var(--text-muted)]">{claim.employeeName ?? claim.employeeEmail}</td>
                      )}
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
                          onClick={() => (owner && isEditable(claim.status) ? openEdit(claim) : openDetail(claim))}
                          className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
                        >
                          <Icon name={owner && isEditable(claim.status) ? "Pencil" : "Eye"} size={13} />
                          {owner && isEditable(claim.status) ? "Edit" : "View"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!loading && claims.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="Receipt" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    No expense claims in this view.
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

      <ExpenseClaimFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        categories={categories}
        editing={editing}
        onSaved={handleSaved}
      />

      <ClaimDetailDrawer
        claim={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        canManage={canManage}
        isOwner={!!user && selected?.employeeId === user.id}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        onEditRequest={(claim) => {
          setSelected(null);
          openEdit(claim);
        }}
      />
    </div>
  );
}
