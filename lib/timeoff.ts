"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { BadgeTone } from "@/components/ui/Badge";

/* =========================================================
   Time Off — leaves, permissions, regularization, extra hours
   ---------------------------------------------------------
   A thin client over the `/timeoff` API:
     • employees list / apply their own requests
     • the configured approver role sees an inbox and can
       approve / reject (HR by default; admin can re-point any
       request type to another role via Approval Flow)
     • admins configure which role approves each request type
   ========================================================= */

export type TimeOffRequestType = "LEAVE" | "PERMISSION" | "REGULARIZATION" | "EXTRA_HOURS";
export type TimeOffRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveType = "CASUAL" | "SICK" | "EARNED" | "COMP_OFF" | "PERSONAL" | "UNPAID";

export const REQUEST_TYPES: TimeOffRequestType[] = ["LEAVE", "PERMISSION", "REGULARIZATION", "EXTRA_HOURS"];
export const REQUEST_TYPE_LABEL: Record<TimeOffRequestType, string> = {
  LEAVE: "Leave",
  PERMISSION: "Permission",
  REGULARIZATION: "Regularization",
  EXTRA_HOURS: "Extra Hours",
};
export const REQUEST_TYPE_ICON: Record<TimeOffRequestType, string> = {
  LEAVE: "Leaf",
  PERMISSION: "Clock",
  REGULARIZATION: "RotateCcw",
  EXTRA_HOURS: "Timer",
};

export const LEAVE_TYPES: LeaveType[] = ["CASUAL", "SICK", "EARNED", "COMP_OFF", "PERSONAL", "UNPAID"];
export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  CASUAL: "Casual",
  SICK: "Sick",
  EARNED: "Earned",
  COMP_OFF: "Comp-off",
  PERSONAL: "Personal",
  UNPAID: "Unpaid",
};
export const LEAVE_TYPE_TONE: Record<LeaveType, BadgeTone> = {
  CASUAL: "brand",
  SICK: "danger",
  EARNED: "success",
  COMP_OFF: "info",
  PERSONAL: "warning",
  UNPAID: "muted",
};

export const STATUSES: TimeOffRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];
export const STATUS_LABEL: Record<TimeOffRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
export const STATUS_TONE: Record<TimeOffRequestStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

/** A time-off request as returned by the API. */
export interface TimeOffRequest {
  id: string;
  type: TimeOffRequestType;
  status: TimeOffRequestStatus;
  reason: string;

  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeCode: string | null;
  department: string | null;
  designation: string | null;

  // leave
  leaveType: LeaveType | null;
  fromDate: string | null;
  toDate: string | null;
  days: number | null;

  // permission
  permissionDate: string | null;
  fromTime: string | null;
  toTime: string | null;

  // regularization
  regularizationDate: string | null;
  actualInTime: string | null;
  actualOutTime: string | null;

  // extra hours
  extraHoursDate: string | null;
  extraHoursFrom: string | null;
  extraHoursTo: string | null;
  extraHours: number | null;

  // approval audit
  approverId: string | null;
  approverName: string | null;
  approverRoleId: string | null;
  approverRoleName: string | null;
  approvedAt: string | null;
  approvalComment: string | null;

  createdAt: string;
}

export interface LeaveBalance {
  leaveType: LeaveType;
  year: number;
  total: number;
  used: number;
  remaining: number;
}

export interface ApprovalFlow {
  requestType: TimeOffRequestType;
  approverRoleId: string;
  approverRoleName: string;
}

export interface TimeOffListResult {
  requests: TimeOffRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TimeOffListParams {
  type?: TimeOffRequestType;
  status?: TimeOffRequestStatus;
  page?: number;
  pageSize?: number;
}

/** Payload for creating a request — only the fields for the chosen type are sent. */
export interface TimeOffRequestPayload {
  type: TimeOffRequestType;
  reason: string;

  // leave
  leaveType?: LeaveType;
  fromDate?: string;
  toDate?: string;
  days?: number;

  // permission
  permissionDate?: string;
  fromTime?: string;
  toTime?: string;

  // regularization
  regularizationDate?: string;
  actualInTime?: string;
  actualOutTime?: string;

  // extra hours
  extraHoursDate?: string;
  extraHoursFrom?: string;
  extraHoursTo?: string;
  extraHours?: number;
}

/* ---------------- helpers ---------------- */

/** "15 Jan 2026" — the format used across the module. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** yyyy-mm-dd for a date input, or "" when the value is empty. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** "14:30" stays as-is; null becomes "—". */
export function formatTime(value: string | null | undefined): string {
  return value ?? "—";
}

/* ---------------- api ---------------- */

function queryString(params: TimeOffListParams): string {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function listRequests(params: TimeOffListParams = {}): Promise<TimeOffListResult> {
  return api.get<TimeOffListResult>(`/timeoff${queryString(params)}`);
}

export function listInbox(params: TimeOffListParams = {}): Promise<TimeOffListResult> {
  return api.get<TimeOffListResult>(`/timeoff/inbox${queryString(params)}`);
}

export function getRequest(id: string): Promise<{ request: TimeOffRequest }> {
  return api.get<{ request: TimeOffRequest }>(`/timeoff/${id}`);
}

export function createRequest(
  payload: TimeOffRequestPayload,
): Promise<{ request: TimeOffRequest }> {
  return api.post<{ request: TimeOffRequest }>("/timeoff", payload);
}

export function approveRequest(
  id: string,
  comment?: string,
): Promise<{ request: TimeOffRequest }> {
  return api.patch<{ request: TimeOffRequest }>(`/timeoff/${id}/approve`, { comment });
}

export function rejectRequest(
  id: string,
  comment?: string,
): Promise<{ request: TimeOffRequest }> {
  return api.patch<{ request: TimeOffRequest }>(`/timeoff/${id}/reject`, { comment });
}

export function listLeaveBalances(): Promise<{ balances: LeaveBalance[] }> {
  return api.get<{ balances: LeaveBalance[] }>("/timeoff/balances");
}

export function listApprovalFlows(): Promise<{ flows: ApprovalFlow[] }> {
  return api.get<{ flows: ApprovalFlow[] }>("/timeoff/approval-flows");
}

export function updateApprovalFlow(
  requestType: TimeOffRequestType,
  approverRoleId: string,
): Promise<{ flow: ApprovalFlow }> {
  return api.patch<{ flow: ApprovalFlow }>(`/timeoff/approval-flows/${requestType}`, {
    approverRoleId,
  });
}

/* ---------------- react hooks ---------------- */

export function useTimeOffRequests(params: TimeOffListParams, enabled = true) {
  const key = JSON.stringify(params);
  const [data, setData] = useState<TimeOffListResult | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    listRequests(params)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) {
          setData(null);
          setError(e instanceof Error ? e.message : "Failed to load requests");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // `key` is the stable serialisation of `params`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, enabled]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refresh };
}

export function useTimeOffInbox(params: TimeOffListParams, enabled = true) {
  const key = JSON.stringify(params);
  const [data, setData] = useState<TimeOffListResult | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    listInbox(params)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) {
          setData(null);
          setError(e instanceof Error ? e.message : "Failed to load the approval inbox");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, enabled]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refresh };
}

export function useLeaveBalances(enabled = true) {
  const [balances, setBalances] = useState<LeaveBalance[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    listLeaveBalances()
      .then((result) => {
        if (active) setBalances(result.balances);
      })
      .catch((e) => {
        if (active) {
          setBalances(null);
          setError(e instanceof Error ? e.message : "Failed to load leave balances");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [nonce, enabled]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { balances, loading, error, refresh };
}

export function useApprovalFlows(enabled = true) {
  const [flows, setFlows] = useState<ApprovalFlow[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    listApprovalFlows()
      .then((result) => {
        if (active) setFlows(result.flows);
      })
      .catch((e) => {
        if (active) {
          setFlows(null);
          setError(e instanceof Error ? e.message : "Failed to load approval flows");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [nonce, enabled]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { flows, loading, error, refresh };
}
