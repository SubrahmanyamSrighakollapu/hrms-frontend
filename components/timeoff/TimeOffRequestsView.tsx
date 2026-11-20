"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { TimeOffRequestDrawer } from "@/components/timeoff/TimeOffRequestDrawer";
import {
  LEAVE_TYPE_LABEL,
  LEAVE_TYPE_TONE,
  REQUEST_TYPE_ICON,
  REQUEST_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  formatDate,
  formatTime,
  useLeaveBalances,
  useTimeOffRequests,
  type LeaveType,
  type TimeOffRequest,
  type TimeOffRequestStatus,
  type TimeOffRequestType,
} from "@/lib/timeoff";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: (TimeOffRequestStatus | "")[] = ["", "PENDING", "APPROVED", "REJECTED"];

/**
 * Shared view for the four self-service time-off pages (leaves, permissions,
 * regularization, extra hours). Renders balance cards (leaves only), a
 * type-specific table, status filter, pagination and the apply drawer.
 */
export function TimeOffRequestsView({ type }: { type: TimeOffRequestType }) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<TimeOffRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<TimeOffRequest | null>(null);

  const { balances } = useLeaveBalances(type === "LEAVE");

  const params = useMemo(
    () => ({ type, status: statusFilter || undefined, page, pageSize: PAGE_SIZE }),
    [type, statusFilter, page],
  );

  const { data, loading, error, refresh } = useTimeOffRequests(params);
  const requests = data?.requests ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleCreated = (request: TimeOffRequest) => {
    toast.success(`${REQUEST_TYPE_LABEL[request.type]} request submitted.`);
    refresh();
  };

  const leaveBalances = balances ?? [];

  return (
    <div>
      {/* Balance cards — leaves only */}
      {type === "LEAVE" && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {leaveBalances.map((b) => {
            const pct = b.total > 0 ? Math.min(100, (b.used / b.total) * 100) : 0;
            return (
              <div key={b.leaveType} className="card p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {LEAVE_TYPE_LABEL[b.leaveType as LeaveType]}
                  </span>
                  <Badge tone={LEAVE_TYPE_TONE[b.leaveType as LeaveType]}>{b.remaining}</Badge>
                </div>
                <div className="mt-1.5 text-lg font-bold text-[var(--text)]">
                  {b.used} <span className="text-xs font-normal text-[var(--text-subtle)]">/ {b.total}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--slate-100)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand-500)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[0.68rem] text-[var(--text-subtle)]">{b.remaining} remaining</div>
              </div>
            );
          })}
          {leaveBalances.length === 0 && (
            <div className="col-span-full card p-4 text-center text-sm text-[var(--text-muted)]">
              No leave balances configured for this year.
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={15} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
              <Icon name={REQUEST_TYPE_ICON[type]} size={15} className="text-[var(--brand-600)]" />
              {REQUEST_TYPE_LABEL[type]} requests
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TimeOffRequestStatus | "");
                setPage(1);
              }}
              className="input-base w-auto py-1.5 text-[0.82rem]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s ? STATUS_LABEL[s] : "All statuses"}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem]"
          >
            <Icon name="Plus" size={15} /> Apply
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                {type === "LEAVE" && (
                  <>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">To</th>
                    <th className="px-4 py-3 font-medium">Days</th>
                  </>
                )}
                {type === "PERMISSION" && (
                  <>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">To</th>
                  </>
                )}
                {type === "REGULARIZATION" && (
                  <>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">In time</th>
                    <th className="px-4 py-3 font-medium">Out time</th>
                  </>
                )}
                {type === "EXTRA_HOURS" && (
                  <>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">To</th>
                    <th className="px-4 py-3 font-medium">Hours</th>
                  </>
                )}
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Loading requests…
                  </td>
                </tr>
              )}

              {!loading &&
                requests.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                    {type === "LEAVE" && (
                      <>
                        <td className="px-4 py-3">
                          <Badge tone={LEAVE_TYPE_TONE[r.leaveType as LeaveType]}>
                            {r.leaveType ? LEAVE_TYPE_LABEL[r.leaveType as LeaveType] : "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.fromDate)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.toDate)}</td>
                        <td className="px-4 py-3 text-[var(--text)]">{r.days}</td>
                      </>
                    )}
                    {type === "PERMISSION" && (
                      <>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.permissionDate)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatTime(r.fromTime)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatTime(r.toTime)}</td>
                      </>
                    )}
                    {type === "REGULARIZATION" && (
                      <>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.regularizationDate)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatTime(r.actualInTime)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatTime(r.actualOutTime)}</td>
                      </>
                    )}
                    {type === "EXTRA_HOURS" && (
                      <>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.extraHoursDate)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatTime(r.extraHoursFrom)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatTime(r.extraHoursTo)}</td>
                        <td className="px-4 py-3 text-[var(--text)]">{r.extraHours}h</td>
                      </>
                    )}
                    <td className="max-w-[200px] px-4 py-3 text-[var(--text-muted)]">
                      <span className="line-clamp-1" title={r.reason}>
                        {r.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetail(r)}
                        aria-label="View details"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--slate-100)]"
                      >
                        <Icon name="Eye" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name={REQUEST_TYPE_ICON[type]} size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    No {REQUEST_TYPE_LABEL[type].toLowerCase()} requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)]">
          <span>
            {data
              ? `Showing ${requests.length} of ${data.total} request${data.total === 1 ? "" : "s"}`
              : "—"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="btn-ghost inline-flex h-8 items-center gap-1.5 px-2.5 text-xs disabled:opacity-50"
            >
              <Icon name="ChevronLeft" size={14} /> Prev
            </button>
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="btn-ghost inline-flex h-8 items-center gap-1.5 px-2.5 text-xs disabled:opacity-50"
            >
              Next <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        </div>
      </div>

      <TimeOffRequestDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaultType={type}
        onCreated={handleCreated}
      />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Request details"
        description={detail ? REQUEST_TYPE_LABEL[detail.type] : ""}
        footer={
          <button type="button" onClick={() => setDetail(null)} className="btn-primary h-9 px-4 text-[0.84rem]">
            Close
          </button>
        }
      >
        {detail && (
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)]">Status</dt>
              <dd>
                <Badge tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
              </dd>
            </div>
            {detail.type === "LEAVE" && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Leave type</dt>
                  <dd className="font-medium text-[var(--text)]">
                    {detail.leaveType ? LEAVE_TYPE_LABEL[detail.leaveType as LeaveType] : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">From</dt>
                  <dd className="text-[var(--text)]">{formatDate(detail.fromDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">To</dt>
                  <dd className="text-[var(--text)]">{formatDate(detail.toDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Days</dt>
                  <dd className="text-[var(--text)]">{detail.days}</dd>
                </div>
              </>
            )}
            {detail.type === "PERMISSION" && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Date</dt>
                  <dd className="text-[var(--text)]">{formatDate(detail.permissionDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">From</dt>
                  <dd className="text-[var(--text)]">{formatTime(detail.fromTime)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">To</dt>
                  <dd className="text-[var(--text)]">{formatTime(detail.toTime)}</dd>
                </div>
              </>
            )}
            {detail.type === "REGULARIZATION" && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Date</dt>
                  <dd className="text-[var(--text)]">{formatDate(detail.regularizationDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Actual in</dt>
                  <dd className="text-[var(--text)]">{formatTime(detail.actualInTime)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Actual out</dt>
                  <dd className="text-[var(--text)]">{formatTime(detail.actualOutTime)}</dd>
                </div>
              </>
            )}
            {detail.type === "EXTRA_HOURS" && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Date</dt>
                  <dd className="text-[var(--text)]">{formatDate(detail.extraHoursDate)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">From</dt>
                  <dd className="text-[var(--text)]">{formatTime(detail.extraHoursFrom)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">To</dt>
                  <dd className="text-[var(--text)]">{formatTime(detail.extraHoursTo)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">Extra hours</dt>
                  <dd className="text-[var(--text)]">{detail.extraHours}h</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-[var(--text-muted)]">Reason</dt>
              <dd className="mt-1 rounded-md bg-[var(--surface-2)] px-3 py-2 text-[var(--text)]">
                {detail.reason}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)]">Approver</dt>
              <dd className="text-[var(--text)]">{detail.approverRoleName ?? "—"}</dd>
            </div>
            {detail.approvalComment && (
              <div>
                <dt className="text-[var(--text-muted)]">Approver comment</dt>
                <dd className="mt-1 rounded-md bg-[var(--surface-2)] px-3 py-2 text-[var(--text)]">
                  {detail.approvalComment}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)]">Applied on</dt>
              <dd className="text-[var(--text)]">{formatDate(detail.createdAt)}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
