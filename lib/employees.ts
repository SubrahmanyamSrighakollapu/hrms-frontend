"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { BadgeTone } from "@/components/ui/Badge";

/* =========================================================
   Employees — directory, records and self service
   ---------------------------------------------------------
   A thin client over the `/employees` API:
     • the directory list   (filters + pagination + status summary)
     • employee CRUD, status changes and password resets
     • the signed-in employee's own record (`/employees/me`)

   Employees are `User` rows on the backend; each one is linked
   to a role (which grants access), a department and a manager.
   ========================================================= */

export type EmployeeCategory = "INTERN" | "FRESHER" | "EXPERIENCED" | "CONTRACT";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export const CATEGORIES: EmployeeCategory[] = ["INTERN", "FRESHER", "EXPERIENCED", "CONTRACT"];
export const CATEGORY_LABEL: Record<EmployeeCategory, string> = {
  INTERN: "Intern",
  FRESHER: "Fresher",
  EXPERIENCED: "Experienced",
  CONTRACT: "Contract",
};
export const CATEGORY_TONE: Record<EmployeeCategory, BadgeTone> = {
  INTERN: "info",
  FRESHER: "brand",
  EXPERIENCED: "success",
  CONTRACT: "warning",
};

export const EMPLOYMENT_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"];
export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERN: "Internship",
};

export const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];
export const GENDER_LABEL: Record<Gender, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

export const STATUSES: EmployeeStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];
export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};
export const STATUS_TONE: Record<EmployeeStatus, BadgeTone> = {
  ACTIVE: "success",
  INACTIVE: "muted",
  SUSPENDED: "danger",
};

/** Probation window per category — mirrors the backend derivation. */
export const PROBATION_MONTHS: Record<EmployeeCategory, number | null> = {
  INTERN: 6,
  FRESHER: 6,
  EXPERIENCED: 3,
  CONTRACT: null,
};

/** An employee record as returned by the `/employees` endpoints. */
export interface Employee {
  id: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  statusRaw: EmployeeStatus;
  category: EmployeeCategory;
  employmentType: EmploymentType;
  priorExperienceMonths: number;
  designation: string | null;
  departmentId: string | null;
  department: string | null;
  managerId: string | null;
  managerName: string | null;
  roleId: string | null;
  roleName: string | null;
  joinedAt: string | null;
  probationEndDate: string | null;
  confirmationDate: string | null;
  contractEndDate: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface EmployeeSummary {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

export interface EmployeeListResult {
  employees: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: EmployeeSummary;
}

export interface FormOptions {
  departments: { id: string; name: string; code: string | null }[];
  roles: { id: string; name: string }[];
  managers: { id: string; name: string; email: string }[];
}

export interface EmployeeListParams {
  q?: string;
  status?: EmployeeStatus | "";
  category?: EmployeeCategory | "";
  departmentId?: string;
  roleId?: string;
  page?: number;
  pageSize?: number;
}

/** Create / update payload — every field is optional so one type serves both. */
export interface EmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  designation?: string | null;
  departmentId?: string | null;
  roleId?: string | null;
  managerId?: string | null;
  category?: EmployeeCategory;
  employmentType?: EmploymentType;
  priorExperienceMonths?: number;
  joinedAt?: string | null;
  probationEndDate?: string | null;
  confirmationDate?: string | null;
  contractEndDate?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  password?: string;
}

/* ---------------- helpers ---------------- */

/** "15 Jan 2026" — the format used across the directory. */
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

/* ---------------- api ---------------- */

function queryString(params: EmployeeListParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.category) search.set("category", params.category);
  if (params.departmentId) search.set("departmentId", params.departmentId);
  if (params.roleId) search.set("roleId", params.roleId);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function listEmployees(params: EmployeeListParams = {}): Promise<EmployeeListResult> {
  return api.get<EmployeeListResult>(`/employees${queryString(params)}`);
}

export function getEmployee(id: string): Promise<{ employee: Employee }> {
  return api.get<{ employee: Employee }>(`/employees/${id}`);
}

export function createEmployee(
  payload: EmployeePayload,
): Promise<{ employee: Employee; temporaryPassword?: string }> {
  return api.post<{ employee: Employee; temporaryPassword?: string }>("/employees", payload);
}

export function updateEmployee(id: string, payload: EmployeePayload): Promise<{ employee: Employee }> {
  return api.patch<{ employee: Employee }>(`/employees/${id}`, payload);
}

export function changeEmployeeStatus(
  id: string,
  status: EmployeeStatus,
  reason?: string,
): Promise<{ employee: Employee }> {
  return api.patch<{ employee: Employee }>(`/employees/${id}/status`, { status, reason });
}

export function resetEmployeePassword(
  id: string,
): Promise<{ employee: Employee; temporaryPassword?: string }> {
  return api.post<{ employee: Employee; temporaryPassword?: string }>(`/employees/${id}/reset-password`);
}

export function getMyProfile(): Promise<{ employee: Employee }> {
  return api.get<{ employee: Employee }>("/employees/me");
}

export function updateMyProfile(payload: EmployeePayload): Promise<{ employee: Employee }> {
  return api.patch<{ employee: Employee }>("/employees/me", payload);
}

/* ---------------- form options cache ----------------
   Departments, roles and managers change rarely, so they are fetched once and
   shared by every drawer until explicitly refreshed. */

const OPTIONS_EVENT = "hrms:employee-options";

let optionsCache: FormOptions | null = null;
let optionsInflight: Promise<FormOptions> | null = null;

function emitOptions() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPTIONS_EVENT));
}

export function refreshFormOptions(): Promise<FormOptions> {
  if (optionsInflight) return optionsInflight;

  optionsInflight = api
    .get<FormOptions>("/employees/form-options")
    .then((options) => {
      optionsCache = options;
      emitOptions();
      return options;
    })
    .finally(() => {
      optionsInflight = null;
    });

  return optionsInflight;
}

/** Drop the cached options (used on sign-out). */
export function resetEmployeeCache() {
  optionsCache = null;
  optionsInflight = null;
}

export function useFormOptions(enabled = true) {
  const [options, setOptions] = useState<FormOptions | null>(optionsCache);
  const [loading, setLoading] = useState(enabled && !optionsCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sync = () => {
      setOptions(optionsCache);
      setLoading(false);
    };
    window.addEventListener(OPTIONS_EVENT, sync);

    // A request may already be in flight from another consumer; its completion
    // emits OPTIONS_EVENT, which resolves this hook through `sync`.
    if (!optionsCache && !optionsInflight) {
      refreshFormOptions()
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to load form options"))
        .finally(() => setLoading(false));
    }

    return () => window.removeEventListener(OPTIONS_EVENT, sync);
  }, [enabled]);

  return { options, loading: enabled && loading, error };
}

/* ---------------- react hooks ---------------- */

export function useEmployees(params: EmployeeListParams, enabled = true) {
  const key = JSON.stringify(params);
  const [data, setData] = useState<EmployeeListResult | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  // The request whose response has been applied; `loading` is derived from it.
  const [settled, setSettled] = useState<string | null>(null);
  const requestId = `${key}#${nonce}`;

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    listEmployees(params)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) {
          setData(null);
          setError({ id: requestId, message: e instanceof Error ? e.message : "Failed to load employees" });
        }
      })
      .finally(() => {
        if (active) setSettled(requestId);
      });

    return () => {
      active = false;
    };
    // `key` is the stable serialisation of `params`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, enabled]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data,
    loading: enabled && settled !== requestId,
    error: error && error.id === requestId ? error.message : null,
    refresh,
  };
}

export function useEmployee(id: string | null) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<string | null>(null);
  const requestId = `${id ?? ""}#${nonce}`;

  useEffect(() => {
    if (!id) return;
    let active = true;

    getEmployee(id)
      .then((result) => {
        if (active) setEmployee(result.employee);
      })
      .catch((e) => {
        if (active) {
          setEmployee(null);
          setError({ id: requestId, message: e instanceof Error ? e.message : "Failed to load the employee" });
        }
      })
      .finally(() => {
        if (active) setSettled(requestId);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return {
    employee,
    loading: !!id && settled !== requestId,
    error: error && error.id === requestId ? error.message : null,
    refresh,
  };
}
