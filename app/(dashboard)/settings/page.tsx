"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { listEmployees, type Employee } from "@/lib/employees";
import {
  getOrganizationProfile,
  listManagedLeaveBalances,
  setManagedLeaveBalance,
  updateOrganizationProfile,
  type LeaveType,
  type ManagedLeaveBalance,
  type OrganizationProfile,
} from "@/lib/settings";

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "CASUAL", label: "Casual" },
  { value: "SICK", label: "Sick" },
  { value: "EARNED", label: "Earned" },
  { value: "COMP_OFF", label: "Comp-off" },
  { value: "PERSONAL", label: "Personal" },
  { value: "UNPAID", label: "Unpaid" },
];

async function listAllEmployees(): Promise<Employee[]> {
  const firstPage = await listEmployees({ page: 1, pageSize: 100 });
  if (firstPage.totalPages <= 1) return firstPage.employees;
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      listEmployees({ page: index + 2, pageSize: 100 }),
    ),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.employees);
}

export default function SettingsPage() {
  const toast = useToast();
  const nowYear = new Date().getFullYear();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", supportEmail: "", timezone: "" });
  const [balances, setBalances] = useState<ManagedLeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [year, setYear] = useState(nowYear);
  const [balanceForm, setBalanceForm] = useState<{ employeeId: string; leaveType: LeaveType; total: string }>({
    employeeId: "",
    leaveType: "CASUAL",
    total: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      getOrganizationProfile(),
      listManagedLeaveBalances(year),
      listAllEmployees(),
    ])
      .then(([profileResult, balanceRows, employeeRows]) => {
        if (!active) return;
        setProfile(profileResult.profile);
        setProfileForm({
          name: profileResult.profile.name,
          supportEmail: profileResult.profile.supportEmail ?? "",
          timezone: profileResult.profile.timezone,
        });
        setBalances(balanceRows);
        setEmployees(employeeRows);
        setError(null);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load settings");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year, retry]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const result = await updateOrganizationProfile({
        name: profileForm.name.trim(),
        supportEmail: profileForm.supportEmail.trim() || null,
        timezone: profileForm.timezone.trim(),
      });
      setProfile(result.profile);
      toast.success("Organization profile saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save organization profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveBalance = async () => {
    const total = Number(balanceForm.total);
    if (!balanceForm.employeeId || !Number.isFinite(total) || total < 0) {
      toast.error("Choose an employee and enter a valid entitlement");
      return;
    }
    setSavingBalance(true);
    try {
      await setManagedLeaveBalance({ ...balanceForm, total, year });
      const latest = await listManagedLeaveBalances(year);
      setBalances(latest);
      setEditingId(null);
      setBalanceForm({ employeeId: "", leaveType: "CASUAL", total: "" });
      toast.success("Leave entitlement saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save leave entitlement");
    } finally {
      setSavingBalance(false);
    }
  };

  const editBalance = (balance: ManagedLeaveBalance) => {
    setEditingId(balance.id);
    setBalanceForm({
      employeeId: balance.employeeId,
      leaveType: balance.leaveType,
      total: String(balance.total),
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Workspace profile and time-off entitlements" />
      {error ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-[var(--text)]">Settings could not be loaded</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); setRetry((value) => value + 1); }} className="btn-primary mt-4 px-4 py-2 text-sm">Try again</button>
        </div>
      ) : loading || !profile ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading persisted settings…</div>
      ) : (
        <>
          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]"><Icon name="Building2" size={19} /></span>
              <div><h2 className="font-semibold text-[var(--text)]">Organization profile</h2><p className="text-sm text-[var(--text-muted)]">These details are stored for the workspace.</p></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Organization name" required><Input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} maxLength={100} /></Field>
              <Field label="Support email"><Input type="email" value={profileForm.supportEmail} onChange={(event) => setProfileForm({ ...profileForm, supportEmail: event.target.value })} maxLength={160} /></Field>
              <Field label="IANA time zone" hint="Example: Asia/Kolkata"><Input value={profileForm.timezone} onChange={(event) => setProfileForm({ ...profileForm, timezone: event.target.value })} maxLength={80} /></Field>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={saveProfile} disabled={savingProfile || !profileForm.name.trim() || !profileForm.timezone.trim()} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
                {savingProfile && <Icon name="LoaderCircle" size={15} className="animate-spin" />} Save profile
              </button>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]"><Icon name="CalendarDays" size={19} /></span>
                <div><h2 className="font-semibold text-[var(--text)]">Employee leave entitlements</h2><p className="text-sm text-[var(--text-muted)]">Set annual balances used by leave validation and employee dashboards.</p></div>
              </div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Year
                <select className="input-base mt-1 block" value={year} onChange={(event) => { setLoading(true); setError(null); setYear(Number(event.target.value)); }}>
                  {[nowYear - 1, nowYear, nowYear + 1].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl bg-[var(--surface-2)] p-4 md:grid-cols-4">
              <Field label="Employee" required>
                <Select value={balanceForm.employeeId} onChange={(event) => setBalanceForm({ ...balanceForm, employeeId: event.target.value })}>
                  <option value="">Choose employee</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employeeCode ?? employee.email} · {employee.name}</option>)}
                </Select>
              </Field>
              <Field label="Leave type" required>
                <Select value={balanceForm.leaveType} onChange={(event) => setBalanceForm({ ...balanceForm, leaveType: event.target.value as LeaveType })}>
                  {LEAVE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </Select>
              </Field>
              <Field label="Annual days" required>
                <Input type="number" min="0" max="366" step="0.5" value={balanceForm.total} onChange={(event) => setBalanceForm({ ...balanceForm, total: event.target.value })} />
              </Field>
              <div className="flex items-end gap-2">
                <button type="button" onClick={saveBalance} disabled={savingBalance} className="btn-primary h-10 flex-1 text-sm disabled:opacity-50">
                  {savingBalance ? "Saving…" : editingId ? "Update balance" : "Set balance"}
                </button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setBalanceForm({ employeeId: "", leaveType: "CASUAL", total: "" }); }} className="btn-ghost h-10 px-3 text-sm">Cancel</button>}
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-subtle)]"><th className="pb-2">Employee</th><th className="pb-2">Department</th><th className="pb-2">Leave type</th><th className="pb-2 text-right">Used</th><th className="pb-2 text-right">Entitlement</th><th className="pb-2 text-right">Remaining</th><th className="pb-2 text-right">Action</th></tr></thead>
                <tbody>
                  {balances.map((balance) => (
                    <tr key={balance.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-3"><p className="font-medium text-[var(--text)]">{balance.employeeName}</p><p className="text-xs text-[var(--text-muted)]">{balance.employeeCode ?? balance.email}</p></td>
                      <td className="py-3 text-[var(--text-muted)]">{balance.department ?? "—"}</td>
                      <td className="py-3 text-[var(--text)]">{balance.leaveType.replaceAll("_", " ")}</td>
                      <td className="py-3 text-right text-[var(--text-muted)]">{balance.used}</td>
                      <td className="py-3 text-right text-[var(--text)]">{balance.total}</td>
                      <td className="py-3 text-right text-[var(--text)]">{balance.remaining}</td>
                      <td className="py-3 text-right"><button type="button" onClick={() => editBalance(balance)} className="text-xs font-semibold text-[var(--brand-600)]">Edit</button></td>
                    </tr>
                  ))}
                  {!balances.length && <tr><td colSpan={7} className="py-8 text-center text-sm text-[var(--text-muted)]">No balances configured for {year}.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
