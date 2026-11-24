"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { TablePagination, useClientPagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { assignRole, initials, type EmployeeDef, type RoleDef } from "@/lib/rbac";

const STATUS_TONE: Record<string, "success" | "warning" | "muted"> = {
  Active: "success",
  "On Leave": "warning",
  Inactive: "muted",
};

/** Assignee tab — which employees hold a given role. */
export function AssigneeTab({
  roles,
  employees,
  canManage,
}: {
  roles: RoleDef[];
  employees: EmployeeDef[];
  canManage: boolean;
}) {
  const toast = useToast();

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [pick, setPick] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // Fall back to the first role whenever the selection is empty or has gone away.
  const roleId = roles.some((r) => r.id === selectedRoleId) ? selectedRoleId : (roles[0]?.id ?? "");

  const role = useMemo(() => roles.find((r) => r.id === roleId) ?? null, [roles, roleId]);
  const fallbackRole = useMemo(() => roles.find((r) => r.key === "EMPLOYEE") ?? null, [roles]);

  const assigned = useMemo(() => employees.filter((e) => e.roleId === roleId), [employees, roleId]);
  const candidates = useMemo(() => employees.filter((e) => e.roleId !== roleId), [employees, roleId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assigned;
    return assigned.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.dept.toLowerCase().includes(q),
    );
  }, [assigned, search]);

  const pag = useClientPagination(filtered, 10);

  const add = async () => {
    if (!pick || !roleId) return;
    setBusy(true);
    try {
      const employee = employees.find((e) => e.id === pick);
      await assignRole(pick, roleId);
      toast.success(`${employee?.name ?? "Employee"} assigned to ${role?.name}.`);
      setPick("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign the role.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (employee: EmployeeDef) => {
    if (!fallbackRole) return;
    setBusy(true);
    try {
      await assignRole(employee.id, fallbackRole.id);
      toast.success(`${employee.name} moved back to ${fallbackRole.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unassign the role.");
    } finally {
      setBusy(false);
    }
  };

  if (!roles.length) {
    return (
      <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
        Create a role first, then assign employees to it here.
      </div>
    );
  }

  const isFallbackSelected = !!fallbackRole && roleId === fallbackRole.id;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[180px]">
          <label htmlFor="assignee-role" className="mb-1.5 block text-[0.78rem] font-medium text-[var(--text)]">
            Role
          </label>
          <select
            id="assignee-role"
            value={roleId}
            onChange={(e) => { setSelectedRoleId(e.target.value); setPick(""); pag.setPage(1); }}
            className="input-base py-2 text-sm"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[240px] flex-1">
          <label htmlFor="assignee-pick" className="mb-1.5 block text-[0.78rem] font-medium text-[var(--text)]">
            Add employee to this role
          </label>
          <select
            id="assignee-pick"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            disabled={!canManage || busy}
            className="input-base py-2 text-sm disabled:bg-[var(--surface-2)]"
          >
            <option value="">Select an employee…</option>
            {candidates.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.dept} ({e.email})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!canManage || !pick || busy}
          className="btn-primary inline-flex h-10 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-50"
        >
          <Icon name={busy ? "RefreshCw" : "UserPlus"} size={15} className={busy ? "animate-spin" : ""} /> Add
        </button>
      </div>

      {/* Assignees */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
          <div>
            <h3 className="text-[0.92rem] font-semibold text-[var(--text)]">
              Employees with <span className="text-[var(--brand-700)]">{role?.name}</span>
            </h3>
            <p className="mt-0.5 text-[0.78rem] text-[var(--text-muted)]">
              {assigned.length} employee{assigned.length === 1 ? "" : "s"} inherit this role&apos;s access
            </p>
          </div>
          <div className="relative min-w-[200px] flex-1 sm:max-w-[260px]">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); pag.setPage(1); }}
              placeholder="Search assignees…"
              className="input-base input-base--leading-icon py-2 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pag.pageItems.map((employee) => (
                <tr key={employee.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--slate-50)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)] text-[0.68rem] font-bold text-[var(--brand-700)]">
                        {initials(employee.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[var(--text)]">{employee.name}</div>
                        <div className="truncate text-xs text-[var(--text-muted)]">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{employee.dept}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{employee.title}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[employee.status] ?? "muted"}>{employee.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(employee)}
                      disabled={!canManage || busy || isFallbackSelected}
                      title={isFallbackSelected ? "The Employee role is the fallback" : "Move back to the Employee role"}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] disabled:opacity-40"
                    >
                      <Icon name="UserX" size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                    <Icon name="Users" size={22} className="mx-auto mb-2 text-[var(--text-subtle)]" />
                    {assigned.length === 0
                      ? "No employees are assigned to this role yet."
                      : "No assignees match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={pag.page}
          pageSize={pag.pageSize}
          total={pag.total}
          totalPages={pag.totalPages}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
          label="employees"
        />
      </div>
    </div>
  );
}
