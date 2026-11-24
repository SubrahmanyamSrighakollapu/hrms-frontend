"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { TablePagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { Field, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  LEAVE_TYPE_LABEL,
  REQUEST_TYPE_ICON,
  REQUEST_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  approveRequest,
  formatDate,
  formatTime,
  rejectRequest,
  useTimeOffInbox,
  type LeaveType,
  type TimeOffRequest,
  type TimeOffRequestStatus,
  type TimeOffRequestType,
} from "@/lib/timeoff";

const PAGE_SIZE = 10;

type Decision = "APPROVED" | "REJECTED";

/** Compact type-specific summary for the inbox table. */
function requestSummary(r: TimeOffRequest): string {
  switch (r.type) {
    case "LEAVE":
      return `${r.leaveType ? LEAVE_TYPE_LABEL[r.leaveType as LeaveType] : "Leave"} · ${formatDate(r.fromDate)} → ${formatDate(r.toDate)} · ${r.days}d`;
    case "PERMISSION":
      return `${formatDate(r.permissionDate)} · ${formatTime(r.fromTime)} → ${formatTime(r.toTime)}`;
    case "REGULARIZATION":
      return `${formatDate(r.regularizationDate)} · in ${formatTime(r.actualInTime)} / out ${formatTime(r.actualOutTime)}`;
    case "EXTRA_HOURS":
      return `${formatDate(r.extraHoursDate)} · ${formatTime(r.extraHoursFrom)} → ${formatTime(r.extraHoursTo)} · ${r.extraHours}h`;
    default:
      return "—";
  }
}

export default function ApprovalsPage() {
  const { can } = useAuth();

  if (!can("time-off", "MANAGE")) {
    return (
      <div className="mx-auto max-w-lg card p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--danger-bg)] text-[var(--danger)]">
          <Icon name="ShieldCheck" size={22} />
        </div>
        <h3 className="mt-4 font-semibold text-[var(--text)]">Restricted area</h3>
        <p className="mt-1.5 text-[0.85rem] text-[var(--text-muted)]">
          Only managers with approval rights can open the approval inbox.
        </p>
      </div>
    );
  }

  return <ApprovalsInbox />;
}

function ApprovalsInbox() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState<TimeOffRequestType | "">("");
  const [statusFilter, setStatusFilter] = useState<TimeOffRequestStatus | "">("PENDING");
  const [page, setPage] = useState(1);

  const [decision, setDecision] = useState<{ request: TimeOffRequest; action: Decision } | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const params = useMemo(
    () => ({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [typeFilter, statusFilter, page],
  );

  const { data, loading, error, refresh } = useTimeOffInbox(params);
  const requests = data?.requests ?? [];
  const totalPages = data?.totalPages ?? 1;

  const openDecision = (request: TimeOffRequest, action: Decision) => {
    setComment("");
    setDecision({ request, action });
  };

  const confirm = async () => {
    if (!decision) return;
    setBusy(true);
    try {
      const fn = decision.action === "APPROVED" ? approveRequest : rejectRequest;
      await fn(decision.request.id, comment.trim() || undefined);
      toast.success(`Request ${decision.action === "APPROVED" ? "approved" : "rejected"}.`);
      setDecision(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process the request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={15} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
            <Icon name="CheckCircle2" size={15} className="text-[var(--brand-600)]" />
            Approval inbox
          </span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TimeOffRequestType | "");
              setPage(1);
            }}
            className="input-base w-auto py-1.5 text-[0.82rem]"
          >
            <option value="">All types</option>
            {(["LEAVE", "PERMISSION", "REGULARIZATION", "EXTRA_HOURS"] as TimeOffRequestType[]).map((t) => (
              <option key={t} value={t}>
                {REQUEST_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TimeOffRequestStatus | "");
              setPage(1);
            }}
            className="input-base w-auto py-1.5 text-[0.82rem]"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Loading requests…
                  </td>
                </tr>
              )}

              {!loading &&
                requests.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text)]">{r.employeeName}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {r.employeeCode ? `${r.employeeCode} · ` : ""}
                        {r.department ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--text)]">
                        <Icon name={REQUEST_TYPE_ICON[r.type]} size={14} className="text-[var(--brand-600)]" />
                        {REQUEST_TYPE_LABEL[r.type]}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-[var(--text-muted)]">
                      <div>{requestSummary(r)}</div>
                      <div className="line-clamp-1 text-xs text-[var(--text-subtle)]" title={r.reason}>
                        {r.reason}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDecision(r, "APPROVED")}
                            className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--success-bg)] px-2.5 text-xs font-medium text-[var(--success)] hover:opacity-90"
                          >
                            <Icon name="Check" size={13} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openDecision(r, "REJECTED")}
                            className="inline-flex h-8 items-center gap-1 rounded-md bg-[var(--danger-bg)] px-2.5 text-xs font-medium text-[var(--danger)] hover:opacity-90"
                          >
                            <Icon name="X" size={13} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-subtle)]">
                          by {r.approverName ?? r.approverRoleName ?? "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="CheckCircle2" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    No requests in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={loading}
          label="requests"
        />
      </div>

      <Modal
        open={!!decision}
        onClose={() => !busy && setDecision(null)}
        tone={decision?.action === "APPROVED" ? "success" : "danger"}
        icon={decision?.action === "APPROVED" ? "CheckCircle2" : "XCircle"}
        title={
          decision
            ? `${decision.action === "APPROVED" ? "Approve" : "Reject"} ${REQUEST_TYPE_LABEL[decision.request.type].toLowerCase()} request?`
            : ""
        }
        description={
          decision
            ? `From ${decision.request.employeeName} — ${requestSummary(decision.request)}.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDecision(null)}
              disabled={busy}
              className="btn-ghost h-9 px-4 text-[0.84rem] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className={`inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60 ${
                decision?.action === "APPROVED"
                  ? "bg-[var(--success)] text-white hover:opacity-90 rounded-lg"
                  : "bg-[var(--danger)] text-white hover:opacity-90 rounded-lg"
              }`}
            >
              {busy && <Icon name="RefreshCw" size={15} className="animate-spin" />}
              {decision?.action === "APPROVED" ? "Approve" : "Reject"}
            </button>
          </>
        }
      >
        <Field label="Comment (optional)" htmlFor="to-decision-comment">
          <Textarea
            id="to-decision-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note for the employee…"
          />
        </Field>
      </Modal>
    </div>
  );
}
