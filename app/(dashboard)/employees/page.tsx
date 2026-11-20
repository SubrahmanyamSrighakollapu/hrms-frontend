"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, DropdownItem, DropdownLink } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { EmployeeFormDrawer } from "@/components/employees/EmployeeFormDrawer";
import { useAuth } from "@/lib/auth-context";
import { assignRole, initials, useRbac } from "@/lib/rbac";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  STATUSES,
  STATUS_LABEL,
  STATUS_TONE,
  changeEmployeeStatus,
  formatDate,
  resetEmployeePassword,
  useEmployees,
  useFormOptions,
  type Employee,
  type EmployeeCategory,
  type EmployeeStatus,
} from "@/lib/employees";

const PAGE_SIZE = 10;

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function EmployeesPage() {
  const { can } = useAuth();
  const canManage = can("employees", "MANAGE");
  const toast = useToast();
  const { roles } = useRbac();
  const { options } = useFormOptions(can("employees"));

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [category, setCategory] = useState<EmployeeCategory | "">("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [credential, setCredential] = useState<{ name: string; password: string } | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ employee: Employee; status: EmployeeStatus } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Debounce the search box so we do not hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [departmentId, category, status]);

  const params = useMemo(
    () => ({
      q: query || undefined,
      departmentId: departmentId || undefined,
      category: category || undefined,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [query, departmentId, category, status, page],
  );

  const { data, loading, error, refresh } = useEmployees(params, can("employees"));

  const employees = data?.employees ?? [];
  const summary = data?.summary;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setDrawerOpen(true);
  };

  const handleSaved = (result: { employee: Employee; temporaryPassword?: string }) => {
    if (result.temporaryPassword) {
      setCredential({ name: result.employee.name, password: result.temporaryPassword });
    }
    toast.success(editing ? `${result.employee.name} updated.` : `${result.employee.name} created.`);
    refresh();
  };

  const changeRole = async (employee: Employee, roleId: string) => {
    setBusyId(employee.id);
    try {
      await assignRole(employee.id, roleId);
      toast.success(`${employee.name}'s role updated.`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the role.");
    } finally {
      setBusyId(null);
    }
  };

  const applyStatus = async () => {
    if (!statusTarget) return;
    setBusyId(statusTarget.employee.id);
    try {
      await changeEmployeeStatus(statusTarget.employee.id, statusTarget.status);
      toast.success(`${statusTarget.employee.name} is now ${STATUS_LABEL[statusTarget.status].toLowerCase()}.`);
      setStatusTarget(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the status.");
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (employee: Employee) => {
    setBusyId(employee.id);
    try {
      const result = await resetEmployeePassword(employee.id);
      if (result.temporaryPassword) {
        setCredential({ name: employee.name, password: result.temporaryPassword });
      }
      toast.success(`Password reset for ${employee.name}.`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusyId(null);
    }
  };

  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard.");
    } catch {
      toast.error("Could not copy — please copy it manually.");
    }
  };

  const exportCsv = () => {
    const header = ["Code", "Name", "Email", "Department", "Designation", "Category", "Role", "Status", "Joined"];
    const lines = employees.map((e) =>
      [
        e.employeeCode ?? "",
        e.name,
        e.email,
        e.department ?? "",
        e.designation ?? "",
        CATEGORY_LABEL[e.category],
        e.roleName ?? "",
        e.status,
        formatDate(e.joinedAt),
      ].map(csvCell).join(","),
    );
    const csv = [header.map(csvCell).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${employees.length} employee${employees.length === 1 ? "" : "s"}.`);
  };

  const cards = [
    { label: "Total employees", value: summary?.total ?? 0, icon: "Users", bg: "var(--brand-50)", color: "var(--brand-600)" },
    { label: "Active", value: summary?.active ?? 0, icon: "UserCheck", bg: "var(--success-bg)", color: "var(--success)" },
    { label: "Suspended", value: summary?.suspended ?? 0, icon: "UserX", bg: "var(--danger-bg)", color: "var(--danger)" },
    { label: "Inactive", value: summary?.inactive ?? 0, icon: "User", bg: "var(--slate-100)", color: "var(--slate-500)" },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Create people, classify them and control their access through roles"
        actions={
          <>
            {can("roles") && (
              <Link href="/roles" className="btn-ghost hidden h-9 items-center gap-2 px-3.5 text-[0.84rem] sm:flex">
                <Icon name="ShieldCheck" size={15} /> Roles &amp; Permissions
              </Link>
            )}
            <button
              type="button"
              onClick={exportCsv}
              disabled={employees.length === 0}
              className="btn-ghost flex h-9 items-center gap-2 px-3.5 text-[0.84rem] disabled:opacity-50"
            >
              <Icon name="Download" size={15} /> Export
            </button>
            {canManage && (
              <button type="button" onClick={openCreate} className="btn-primary flex h-9 items-center gap-2 px-4 text-[0.84rem]">
                <Icon name="Plus" size={15} /> Add Employee
              </button>
            )}
          </>
        }
      />

      {/* One-time temporary password panel */}
      {credential && (
        <div className="fade-in mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--brand-200)] bg-[var(--brand-50)] px-4 py-3">
          <Icon name="KeyRound" size={17} className="text-[var(--brand-700)]" />
          <span className="text-[0.83rem] text-[var(--text)]">
            Temporary password for <b>{credential.name}</b> — share it now, it is not shown again.
          </span>
          <code className="rounded-md border border-[var(--brand-200)] bg-white px-2.5 py-1 text-[0.83rem] font-semibold text-[var(--brand-700)]">
            {credential.password}
          </code>
          <button
            type="button"
            onClick={() => copyPassword(credential.password)}
            className="btn-ghost inline-flex h-8 items-center gap-1.5 px-2.5 text-xs"
          >
            <Icon name="Copy" size={13} /> Copy
          </button>
          <button
            type="button"
            onClick={() => setCredential(null)}
            aria-label="Dismiss"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-[var(--brand-700)] hover:bg-[var(--brand-100)]"
          >
            <Icon name="X" size={15} />
          </button>
        </div>
      )}

      {/* Status summary for the current filter scope */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: card.bg }}>
              <Icon name={card.icon} size={19} style={{ color: card.color }} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)]">{card.label}</div>
              <div className="text-xl font-semibold text-[var(--text)]">{loading ? "—" : card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
          <Icon name="AlertCircle" size={15} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or code…"
              className="input-base py-2 pl-9 text-sm"
            />
          </div>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input-base w-auto py-2 text-sm">
            <option value="">All departments</option>
            {options?.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EmployeeCategory | "")}
            className="input-base w-auto py-2 text-sm"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EmployeeStatus | "")}
            className="input-base w-auto py-2 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                    Loading employees…
                  </td>
                </tr>
              )}

              {!loading &&
                employees.map((employee) => (
                  <tr key={employee.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)] text-[0.68rem] font-bold text-[var(--brand-700)]">
                          {initials(employee.name)}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/employees/${employee.id}`} className="block truncate font-medium text-[var(--text)] hover:text-[var(--brand-700)]">
                            {employee.name}
                          </Link>
                          <div className="truncate text-xs text-[var(--text-muted)]">
                            {employee.employeeCode ? `${employee.employeeCode} · ` : ""}
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      <div>{employee.department ?? "Unassigned"}</div>
                      <div className="text-xs text-[var(--text-subtle)]">{employee.designation ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={CATEGORY_TONE[employee.category]}>{CATEGORY_LABEL[employee.category]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          value={employee.roleId ?? ""}
                          onChange={(e) => changeRole(employee, e.target.value)}
                          disabled={busyId === employee.id}
                          className="input-base w-auto py-1.5 text-[0.82rem] font-medium disabled:opacity-60"
                        >
                          {employee.roleId === null && <option value="">No role</option>}
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[var(--text-muted)]">{employee.roleName ?? "No role"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[employee.statusRaw]}>{employee.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(employee.joinedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Dropdown
                        trigger={({ toggle }) => (
                          <button
                            type="button"
                            onClick={toggle}
                            aria-label="Actions"
                            disabled={busyId === employee.id}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--slate-100)] disabled:opacity-50"
                          >
                            <Icon name={busyId === employee.id ? "RefreshCw" : "MoreVertical"} size={16} className={busyId === employee.id ? "animate-spin" : ""} />
                          </button>
                        )}
                      >
                        {(close) => (
                          <>
                            <DropdownLink icon="Eye" href={`/employees/${employee.id}`} onClick={close}>
                              View profile
                            </DropdownLink>
                            {canManage && (
                              <>
                                <DropdownItem icon="Pencil" onClick={() => { close(); openEdit(employee); }}>
                                  Edit
                                </DropdownItem>
                                <DropdownItem icon="KeyRound" onClick={() => { close(); resetPassword(employee); }}>
                                  Reset password
                                </DropdownItem>
                                {employee.statusRaw === "ACTIVE" ? (
                                  <DropdownItem icon="UserX" danger onClick={() => { close(); setStatusTarget({ employee, status: "SUSPENDED" }); }}>
                                    Suspend
                                  </DropdownItem>
                                ) : (
                                  <DropdownItem icon="UserCheck" onClick={() => { close(); setStatusTarget({ employee, status: "ACTIVE" }); }}>
                                    Activate
                                  </DropdownItem>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </Dropdown>
                    </td>
                  </tr>
                ))}

              {!loading && employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="Users" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    No employees match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)]">
          <span>
            {data ? `Showing ${employees.length} of ${data.total} employee${data.total === 1 ? "" : "s"}` : "—"}
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

      <EmployeeFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employee={editing}
        options={options}
        onSaved={handleSaved}
      />

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        tone={statusTarget?.status === "ACTIVE" ? "success" : "warning"}
        icon={statusTarget?.status === "ACTIVE" ? "UserCheck" : "UserX"}
        title={
          statusTarget
            ? `${statusTarget.status === "ACTIVE" ? "Activate" : statusTarget.status === "SUSPENDED" ? "Suspend" : "Deactivate"} ${statusTarget.employee.name}?`
            : ""
        }
        description={
          statusTarget?.status === "ACTIVE"
            ? "The employee will be able to sign in again immediately."
            : "Their active sessions are ended at once and they will be unable to sign in until reactivated."
        }
        footer={
          <>
            <button type="button" onClick={() => setStatusTarget(null)} className="btn-ghost h-9 px-4 text-[0.84rem]">
              Cancel
            </button>
            <button
              type="button"
              onClick={applyStatus}
              disabled={busyId === statusTarget?.employee.id}
              className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60"
            >
              {busyId === statusTarget?.employee.id && <Icon name="RefreshCw" size={15} className="animate-spin" />}
              {statusTarget?.status === "ACTIVE" ? "Activate" : "Suspend"}
            </button>
          </>
        }
      />
    </div>
  );
}
