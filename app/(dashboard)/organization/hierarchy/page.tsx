"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { listOrganizationEmployees, type OrganizationEmployee } from "@/lib/organization";

export default function HierarchyPage() {
  const [employees, setEmployees] = useState<OrganizationEmployee[]>([]);
  const [department, setDepartment] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    listOrganizationEmployees()
      .then((result) => {
        if (active) {
          setEmployees(result);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load organization hierarchy");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.department).filter((name): name is string => !!name))].sort(),
    [employees],
  );
  const visibleEmployees = useMemo(
    () => department === "ALL" ? employees : employees.filter((employee) => employee.department === department),
    [department, employees],
  );
  const employeeIds = new Set(visibleEmployees.map((employee) => employee.id));
  const reports = new Map<string, OrganizationEmployee[]>();
  for (const employee of visibleEmployees) {
    if (employee.managerId && employeeIds.has(employee.managerId)) {
      const list = reports.get(employee.managerId) ?? [];
      list.push(employee);
      reports.set(employee.managerId, list);
    }
  }

  const roots = visibleEmployees.filter((employee) => !employee.managerId || !employeeIds.has(employee.managerId));
  const rendered = new Set<string>();
  const rootCards = roots.map((employee) => renderNode(employee, reports, rendered, new Set()));
  const unlinkedCards = visibleEmployees
    .filter((employee) => !rendered.has(employee.id))
    .map((employee) => renderNode(employee, reports, rendered, new Set()));

  return (
    <div className="space-y-4">
      <PageHeader title="Organization Hierarchy" subtitle="Active employees and their saved reporting relationships" />
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-[var(--text-muted)]">{employees.length} active employees</p>
        <label className="text-xs font-medium text-[var(--text-muted)]">Department
          <select className="input-base ml-2 min-w-44" value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="ALL">All departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>
      {error ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-[var(--text)]">Hierarchy could not be loaded</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); setRetry((value) => value + 1); }} className="btn-primary mt-4 px-4 py-2 text-sm">Try again</button>
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading reporting relationships…</div>
      ) : visibleEmployees.length ? (
        <div className="card overflow-x-auto p-6 sm:p-8">
          <div className="flex min-w-max flex-col items-center gap-5">
            {[...rootCards, ...unlinkedCards]}
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <Icon name="Network" size={30} className="mx-auto text-[var(--brand-300)]" />
          <p className="mt-3 font-medium text-[var(--text)]">{employees.length ? "No employees in this department" : "No active employees"}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Add employees and assign their managers in the employee directory.</p>
        </div>
      )}
      <p className="text-xs text-[var(--text-subtle)]">Set or change a manager from an employee record to update this view.</p>
    </div>
  );
}

function renderNode(
  employee: OrganizationEmployee,
  reports: Map<string, OrganizationEmployee[]>,
  rendered: Set<string>,
  ancestors: Set<string>,
): React.ReactNode {
  if (ancestors.has(employee.id) || rendered.has(employee.id)) return null;
  rendered.add(employee.id);
  const nextAncestors = new Set(ancestors).add(employee.id);
  const children = (reports.get(employee.id) ?? []).map((child) =>
    renderNode(child, reports, rendered, nextAncestors),
  );
  return (
    <div key={employee.id} className="flex flex-col items-center">
      <div className="w-56 rounded-xl border border-[var(--border)] bg-white p-4 text-center shadow-sm">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-xs font-bold text-white">
          {employee.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
        </div>
        <p className="truncate text-sm font-semibold text-[var(--text)]">{employee.name}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{employee.designation ?? "Designation not set"}</p>
        <p className="mt-1 truncate text-[0.68rem] text-[var(--text-subtle)]">
          {[employee.employeeCode, employee.department].filter(Boolean).join(" · ") || employee.email}
        </p>
      </div>
      {!!children.filter(Boolean).length && (
        <>
          <div className="h-5 w-px bg-[var(--border)]" />
          <div className="flex items-start gap-5 border-t border-[var(--border)] pt-5">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
