"use client";

import { useEffect, useState } from "react";
import { api, getAccessToken } from "@/lib/api";

/* =========================================================
   RBAC — Roles, module permissions and employee assignment
   ---------------------------------------------------------
   Flow:
     1. A role is created (Administrator, HR Manager, custom…)
     2. Each role stores a permission level per module
          NONE  → module hidden
          VIEW  → read-only access
          MANAGE→ full access
     3. An employee is assigned a role
     4. The employee's access is derived from that role

   Everything here is served by the backend (`/roles`,
   `/roles/assignments`); this module is only a thin client
   cache that mirrors the API models:
     Role  ──< RolePermission >──  Module
     Employee ──> Role
   ========================================================= */

export type PermissionLevel = "NONE" | "VIEW" | "MANAGE";
export type SystemRoleKey = "ADMIN" | "HR" | "EMPLOYEE";

export const LEVELS: PermissionLevel[] = ["NONE", "VIEW", "MANAGE"];
export const LEVEL_LABEL: Record<PermissionLevel, string> = {
  NONE: "No access",
  VIEW: "View",
  MANAGE: "Manage",
};
const RANK: Record<PermissionLevel, number> = { NONE: 0, VIEW: 1, MANAGE: 2 };

export interface ModuleDef {
  id: string;
  label: string;
  section: string;
  description: string;
}

/** The module registry — mirrors `src/config/modules.ts` on the backend. */
export const MODULES: ModuleDef[] = [
  { id: "dashboard", label: "Dashboard", section: "Overview", description: "Workspace landing and widgets" },
  { id: "my-info", label: "My Info", section: "Overview", description: "Own profile and employment details" },
  { id: "time-off", label: "Time Off", section: "Workplace", description: "Leaves, permissions, regularization, extra hours" },
  { id: "attendance", label: "Attendance", section: "Workplace", description: "Punches and attendance records" },
  { id: "payroll", label: "Payroll", section: "Workplace", description: "Payslips and payroll runs" },
  { id: "chat", label: "Chat", section: "Workplace", description: "Team messaging" },
  { id: "employees", label: "Employees", section: "Manage", description: "Employee directory and records" },
  { id: "reports", label: "Reports", section: "Manage", description: "Analytics and exports" },
  { id: "organization", label: "Organization", section: "Manage", description: "Departments and hierarchy" },
  { id: "roles", label: "Roles & Permissions", section: "Administration", description: "Roles and module access" },
  { id: "settings", label: "Settings", section: "Administration", description: "Workspace configuration" },
];

export const MODULE_SECTIONS = ["Overview", "Workplace", "Manage", "Administration"] as const;

export interface RoleDef {
  id: string;
  key: string | null; // set for the built-in roles, null for custom ones
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Record<string, PermissionLevel>;
  userCount: number;
  createdAt: string;
}

export interface EmployeeDef {
  id: string;
  name: string;
  email: string;
  dept: string;
  title: string;
  status: "Active" | "On Leave" | "Inactive";
  join: string;
  avatar: string;
  roleId: string | null;
}

/** Raw employee row as returned by `GET /roles/assignments`. */
interface AssignmentDto {
  id: string;
  name: string;
  email: string;
  dept: string;
  title: string;
  status: string;
  joinedAt: string | null;
  roleId: string | null;
}

/* ---------------- helpers ---------------- */

export function emptyPermissions(): Record<string, PermissionLevel> {
  return MODULES.reduce((acc, m) => ({ ...acc, [m.id]: "NONE" as PermissionLevel }), {});
}

export function grantAll(level: PermissionLevel = "MANAGE"): Record<string, PermissionLevel> {
  return MODULES.reduce((acc, m) => ({ ...acc, [m.id]: level }), {});
}

/** True when `permissions` grants at least `level` on `moduleId`. */
export function can(
  permissions: Record<string, PermissionLevel> | undefined,
  moduleId: string,
  level: Exclude<PermissionLevel, "NONE"> = "VIEW",
): boolean {
  const current = permissions?.[moduleId] ?? "NONE";
  return (RANK[current] ?? 0) >= RANK[level];
}

/** How many modules a role can reach, and how many it can fully manage. */
export function roleStats(role: RoleDef) {
  const reachable = MODULES.filter((m) => can(role.permissions, m.id)).length;
  const managed = MODULES.filter((m) => can(role.permissions, m.id, "MANAGE")).length;
  return { reachable, managed, total: MODULES.length };
}

/** Which dashboard variant a role should land on. */
export function dashboardVariant(
  role: { key: string | null } | null,
  permissions: Record<string, PermissionLevel>,
): "admin" | "hr" | "employee" {
  if (role?.key === "ADMIN") return "admin";
  if (role?.key === "HR") return "hr";
  if (can(permissions, "employees", "MANAGE") || can(permissions, "payroll", "MANAGE")) return "hr";
  return "employee";
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/** "Nov 2026" style label used in the employee tables. */
export function formatJoin(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function toEmployee(row: AssignmentDto): EmployeeDef {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    dept: row.dept,
    title: row.title,
    status: (row.status as EmployeeDef["status"]) ?? "Active",
    join: formatJoin(row.joinedAt),
    avatar: initials(row.name),
    roleId: row.roleId,
  };
}

/* ---------------- client cache ---------------- */

const EVENT = "hrms:rbac-change";

let rolesCache: RoleDef[] = [];
let employeesCache: EmployeeDef[] = [];
let loadedOnce = false;
let inflight: Promise<void> | null = null;

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Reload roles + assignments from the API into the cache. */
export function refreshRbac(): Promise<void> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      if (getAccessToken()) {
        const [rolesRes, employeesRes] = await Promise.all([
          api.get<{ roles: RoleDef[] }>("/roles"),
          api.get<{ employees: AssignmentDto[] }>("/roles/assignments"),
        ]);
        rolesCache = rolesRes.roles;
        employeesCache = employeesRes.employees.map(toEmployee);
      } else {
        rolesCache = [];
        employeesCache = [];
      }
      loadedOnce = true;
    } catch (error) {
      // A role without access to these endpoints simply sees an empty set.
      console.warn("RBAC load failed:", error);
      loadedOnce = true;
    } finally {
      inflight = null;
      emit();
    }
  })();

  return inflight;
}

/** Wipe the cache on sign-out. */
export function resetRbac() {
  rolesCache = [];
  employeesCache = [];
  loadedOnce = false;
  emit();
}

/* ---------------- mutations ---------------- */

export interface RoleInput {
  name: string;
  description: string;
  permissions: Record<string, PermissionLevel>;
}

export async function createRole(input: RoleInput): Promise<RoleDef> {
  const res = await api.post<{ role: RoleDef }>("/roles", input);
  await refreshRbac();
  return res.role;
}

export async function saveRole(id: string, input: RoleInput): Promise<RoleDef> {
  const res = await api.patch<{ role: RoleDef }>(`/roles/${id}`, input);
  await refreshRbac();
  return res.role;
}

export async function deleteRole(id: string): Promise<void> {
  await api.del(`/roles/${id}`);
  await refreshRbac();
}

export async function assignRole(employeeId: string, roleId: string): Promise<void> {
  await api.patch(`/roles/assignments/${employeeId}`, { roleId });
  await refreshRbac();
}

/* ---------------- react hook ---------------- */

export function useRbac() {
  const [roles, setRoles] = useState<RoleDef[]>(rolesCache);
  const [employees, setEmployees] = useState<EmployeeDef[]>(employeesCache);
  const [loading, setLoading] = useState(!loadedOnce);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setRoles(rolesCache);
      setEmployees(employeesCache);
      setLoading(!loadedOnce);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);

    if (!loadedOnce && !inflight) {
      refreshRbac().catch((e) => setError(e instanceof Error ? e.message : "Failed to load roles"));
    }

    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { roles, employees, loading, error, refresh: refreshRbac, modules: MODULES };
}
