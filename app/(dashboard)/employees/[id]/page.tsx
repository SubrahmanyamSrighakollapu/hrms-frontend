"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { EmployeeFormDrawer } from "@/components/employees/EmployeeFormDrawer";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@/lib/rbac";
import {
  CATEGORY_LABEL,
  CATEGORY_TONE,
  EMPLOYMENT_TYPE_LABEL,
  GENDER_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  changeEmployeeStatus,
  formatDate,
  resetEmployeePassword,
  useEmployee,
  useFormOptions,
  type Employee,
  type EmployeeStatus,
} from "@/lib/employees";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-[0.92rem] font-semibold text-[var(--text)]">{title}</h3>
      {children}
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        {icon && <Icon name={icon} size={12} />}
        {label}
      </div>
      <div className="mt-0.5 text-[0.85rem] font-medium text-[var(--text)]">{value}</div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;

  const { can } = useAuth();
  const canManage = can("employees", "MANAGE");
  const toast = useToast();
  const { options } = useFormOptions(can("employees"));
  const { employee, loading, error, refresh } = useEmployee(id);

  const [editOpen, setEditOpen] = useState(false);
  const [credential, setCredential] = useState<{ name: string; password: string } | null>(null);
  const [statusTarget, setStatusTarget] = useState<EmployeeStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSaved = (result: { employee: Employee; temporaryPassword?: string }) => {
    if (result.temporaryPassword) {
      setCredential({ name: result.employee.name, password: result.temporaryPassword });
    }
    toast.success(`${result.employee.name} updated.`);
    refresh();
  };

  const applyStatus = async () => {
    if (!employee || !statusTarget) return;
    setBusy(true);
    try {
      await changeEmployeeStatus(employee.id, statusTarget);
      toast.success(`${employee.name} is now ${STATUS_LABEL[statusTarget].toLowerCase()}.`);
      setStatusTarget(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change the status.");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!employee) return;
    setBusy(true);
    try {
      const result = await resetEmployeePassword(employee.id);
      if (result.temporaryPassword) {
        setCredential({ name: employee.name, password: result.temporaryPassword });
      }
      toast.success(`Password reset for ${employee.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusy(false);
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

  if (loading) {
    return (
      <div>
        <PageHeader title="Employee" />
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading employee…</div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div>
        <PageHeader title="Employee" />
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Icon name="AlertCircle" size={22} className="text-[var(--danger)]" />
          <p className="text-sm text-[var(--text-muted)]">{error ?? "This employee could not be found."}</p>
          <Link href="/employees" className="btn-ghost inline-flex h-9 items-center gap-2 px-4 text-[0.84rem]">
            <Icon name="ArrowLeft" size={15} /> Back to employees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/employees"
        className="mb-3 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--brand-700)]"
      >
        <Icon name="ArrowLeft" size={14} /> All employees
      </Link>

      <PageHeader
        title={employee.name}
        subtitle={[employee.designation, employee.department].filter(Boolean).join(" · ") || "Employee record"}
        actions={
          canManage && (
            <>
              <Dropdown
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    disabled={busy}
                    className="btn-ghost inline-flex h-9 items-center gap-2 px-3.5 text-[0.84rem] disabled:opacity-60"
                  >
                    <Icon name="MoreHorizontal" size={16} /> More
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <DropdownItem icon="KeyRound" onClick={() => { close(); resetPassword(); }}>
                      Reset password
                    </DropdownItem>
                    {employee.statusRaw === "ACTIVE" ? (
                      <DropdownItem icon="UserX" danger onClick={() => { close(); setStatusTarget("SUSPENDED"); }}>
                        Suspend access
                      </DropdownItem>
                    ) : (
                      <DropdownItem icon="UserCheck" onClick={() => { close(); setStatusTarget("ACTIVE"); }}>
                        Activate access
                      </DropdownItem>
                    )}
                  </>
                )}
              </Dropdown>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem]"
              >
                <Icon name="Pencil" size={15} /> Edit employee
              </button>
            </>
          )
        }
      />

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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Identity */}
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-50)] text-3xl font-bold text-[var(--brand-700)]">
            {initials(employee.name)}
          </div>
          <h3 className="text-lg font-bold text-[var(--text)]">{employee.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">{employee.designation ?? "No designation"}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge tone={STATUS_TONE[employee.statusRaw]}>{employee.status}</Badge>
            <Badge tone={CATEGORY_TONE[employee.category]}>{CATEGORY_LABEL[employee.category]}</Badge>
            {employee.roleName && <Badge tone="brand">{employee.roleName}</Badge>}
          </div>

          <div className="mt-5 space-y-3 text-left">
            {[
              { i: "Hash", l: employee.employeeCode ?? "—" },
              { i: "Mail", l: employee.email },
              { i: "Phone", l: employee.phone ?? "—" },
              { i: "Briefcase", l: employee.department ?? "Unassigned" },
              { i: "Calendar", l: `Joined ${formatDate(employee.joinedAt)}` },
            ].map((row) => (
              <div key={row.l} className="flex items-center gap-3 text-sm">
                <Icon name={row.i} size={15} className="flex-shrink-0 text-[var(--text-muted)]" />
                <span className="min-w-0 truncate text-[var(--text)]">{row.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5 lg:col-span-2">
          <Card title="Employment details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Info label="Designation" value={employee.designation ?? "—"} />
              <Info label="Department" value={employee.department ?? "Unassigned"} />
              <Info label="Reporting manager" value={employee.managerName ?? "—"} />
              <Info label="Employment type" value={EMPLOYMENT_TYPE_LABEL[employee.employmentType]} />
              <Info label="Role" value={employee.roleName ?? "No role"} />
              <Info label="Date of joining" value={formatDate(employee.joinedAt)} />
            </div>
          </Card>

          <Card title="Classification & probation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Info label="Category" value={CATEGORY_LABEL[employee.category]} />
              <Info label="Prior experience" value={`${employee.priorExperienceMonths} month${employee.priorExperienceMonths === 1 ? "" : "s"}`} />
              <Info label="Probation end" value={formatDate(employee.probationEndDate)} />
              <Info label="Confirmation date" value={formatDate(employee.confirmationDate)} />
              {employee.category === "CONTRACT" && (
                <Info label="Contract end" value={formatDate(employee.contractEndDate)} />
              )}
            </div>
          </Card>

          <Card title="Personal information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Info label="Date of birth" value={formatDate(employee.dateOfBirth)} />
              <Info label="Gender" value={employee.gender ? GENDER_LABEL[employee.gender] : "—"} />
              <Info label="Address" value={employee.address ?? "—"} />
              <Info label="Last login" value={formatDate(employee.lastLoginAt)} />
              <Info label="Added on" value={formatDate(employee.createdAt)} />
            </div>
          </Card>

          <Card title="Emergency contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info label="Contact name" value={employee.emergencyContactName ?? "—"} />
              <Info label="Contact phone" value={employee.emergencyContactPhone ?? "—"} />
            </div>
          </Card>
        </div>
      </div>

      <EmployeeFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        employee={employee}
        options={options}
        onSaved={handleSaved}
      />

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        tone={statusTarget === "ACTIVE" ? "success" : "warning"}
        icon={statusTarget === "ACTIVE" ? "UserCheck" : "UserX"}
        title={`${statusTarget === "ACTIVE" ? "Activate" : "Suspend"} ${employee.name}?`}
        description={
          statusTarget === "ACTIVE"
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
              disabled={busy}
              className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60"
            >
              {busy && <Icon name="RefreshCw" size={15} className="animate-spin" />}
              {statusTarget === "ACTIVE" ? "Activate" : "Suspend"}
            </button>
          </>
        }
      />
    </div>
  );
}
