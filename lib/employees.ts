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
export type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";

/** Blood group options for the self-service profile. */
export const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const MARITAL_STATUSES: MaritalStatus[] = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];
export const MARITAL_STATUS_LABEL: Record<MaritalStatus, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

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
  locationId: string | null;
  location: string | null;
  subLocationId: string | null;
  subLocation: string | null;
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
  emergencyContactRelationship: string | null;
  onboardingCompleted: boolean;
  bankName: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  pan: string | null;
  aadhaar: string | null;
  uan: string | null;
  bloodGroup: string | null;
  maritalStatus: MaritalStatus | null;
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
  departments: {
    id: string;
    name: string;
    code: string | null;
    parentId: string | null;
    parentName: string | null;
  }[];
  roles: { id: string; name: string }[];
  managers: { id: string; name: string; email: string }[];
  /** Active locations an employee can be assigned to. */
  locations: { id: string; name: string; isDefault: boolean }[];
  /** Active sub-locations, each tied to its parent location via `locationId`. */
  subLocations: { id: string; name: string; locationId: string; type: string }[];
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
  locationId?: string | null;
  subLocationId?: string | null;
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
  emergencyContactRelationship?: string | null;
  onboardingCompleted?: boolean;
  bankName?: string | null;
  bankAccount?: string | null;
  ifsc?: string | null;
  pan?: string | null;
  aadhaar?: string | null;
  uan?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: MaritalStatus | null;
  password?: string;
}

/* ---------- My Info child collections (self-scoped) ---------- */

export interface WorkExperience {
  id: string;
  company: string;
  designation: string | null;
  fromDate: string;
  toDate: string | null;
  currentlyWorking: boolean;
  description: string | null;
}

export interface WorkExperienceInput {
  company: string;
  designation?: string | null;
  fromDate: string;
  toDate?: string | null;
  currentlyWorking?: boolean;
  description?: string | null;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string | null;
  phone: string | null;
}

export interface FamilyMemberInput {
  name: string;
  relationship: string;
  dateOfBirth?: string | null;
  phone?: string | null;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  fromYear: number;
  toYear: number | null;
  percentage: number | null;
}

export interface EducationInput {
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  fromYear: number;
  toYear?: number | null;
  percentage?: number | null;
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

/* ---------- My Info child collections (self-scoped) ---------- */

export function listWorkExperience(): Promise<WorkExperience[]> {
  return api.get<{ workExperience: WorkExperience[] }>("/employees/me/work-experience").then((r) => r.workExperience);
}

export function createWorkExperience(input: WorkExperienceInput): Promise<WorkExperience> {
  return api.post<{ workExperience: WorkExperience }>("/employees/me/work-experience", input).then((r) => r.workExperience);
}

export function updateWorkExperience(id: string, input: Partial<WorkExperienceInput>): Promise<WorkExperience> {
  return api.patch<{ workExperience: WorkExperience }>(`/employees/me/work-experience/${id}`, input).then((r) => r.workExperience);
}

export function deleteWorkExperience(id: string): Promise<{ id: string }> {
  return api.del<{ id: string }>(`/employees/me/work-experience/${id}`);
}

export function listFamilyMembers(): Promise<FamilyMember[]> {
  return api.get<{ familyMembers: FamilyMember[] }>("/employees/me/family").then((r) => r.familyMembers);
}

export function createFamilyMember(input: FamilyMemberInput): Promise<FamilyMember> {
  return api.post<{ familyMember: FamilyMember }>("/employees/me/family", input).then((r) => r.familyMember);
}

export function updateFamilyMember(id: string, input: Partial<FamilyMemberInput>): Promise<FamilyMember> {
  return api.patch<{ familyMember: FamilyMember }>(`/employees/me/family/${id}`, input).then((r) => r.familyMember);
}

export function deleteFamilyMember(id: string): Promise<{ id: string }> {
  return api.del<{ id: string }>(`/employees/me/family/${id}`);
}

export function listEducation(): Promise<Education[]> {
  return api.get<{ education: Education[] }>("/employees/me/education").then((r) => r.education);
}

export function createEducation(input: EducationInput): Promise<Education> {
  return api.post<{ education: Education }>("/employees/me/education", input).then((r) => r.education);
}

export function updateEducation(id: string, input: Partial<EducationInput>): Promise<Education> {
  return api.patch<{ education: Education }>(`/employees/me/education/${id}`, input).then((r) => r.education);
}

export function deleteEducation(id: string): Promise<{ id: string }> {
  return api.del<{ id: string }>(`/employees/me/education/${id}`);
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
