"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { initials } from "@/lib/rbac";
import {
  CATEGORY_LABEL,
  CATEGORY_TONE,
  EMPLOYMENT_TYPE_LABEL,
  GENDERS,
  GENDER_LABEL,
  STATUS_TONE,
  formatDate,
  getMyProfile,
  toDateInput,
  updateMyProfile,
  type Employee,
  type EmployeePayload,
  type Gender,
} from "@/lib/employees";

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[0.92rem] font-semibold text-[var(--text)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-0.5 text-[0.85rem] font-medium text-[var(--text)]">{value || "—"}</div>
    </div>
  );
}

interface SelfForm {
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export default function MyInfoPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SelfForm>({
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const apply = (employee: Employee) => {
    setProfile(employee);
    setForm({
      phone: employee.phone ?? "",
      dateOfBirth: toDateInput(employee.dateOfBirth),
      gender: employee.gender ?? "",
      address: employee.address ?? "",
      emergencyContactName: employee.emergencyContactName ?? "",
      emergencyContactPhone: employee.emergencyContactPhone ?? "",
    });
  };

  useEffect(() => {
    let active = true;
    getMyProfile()
      .then((result) => {
        if (active) apply(result.employee);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Failed to load your profile");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const set = <K extends keyof SelfForm>(key: K, value: SelfForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload: EmployeePayload = {
        phone: form.phone.trim() || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: (form.gender || null) as Gender | null,
        address: form.address.trim() || null,
        emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactPhone: form.emergencyContactPhone.trim() || null,
      };
      const result = await updateMyProfile(payload);
      apply(result.employee);
      setEditing(false);
      toast.success("Your details were updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your details.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (profile) apply(profile);
    setEditing(false);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="My Info" subtitle="Your personal and employment details" />
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading your profile…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div>
        <PageHeader title="My Info" subtitle="Your personal and employment details" />
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Icon name="AlertCircle" size={22} className="text-[var(--danger)]" />
          <p className="text-sm text-[var(--text-muted)]">{error ?? "Your profile could not be loaded."}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Info"
        subtitle="Your personal and employment details"
        actions={
          !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem]"
            >
              <Icon name="Pencil" size={15} /> Edit details
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-50)] text-3xl font-bold text-[var(--brand-700)]">
            {initials(profile.name)}
          </div>
          <h3 className="text-lg font-bold text-[var(--text)]">{profile.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">{profile.designation ?? "No designation"}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge tone={STATUS_TONE[profile.statusRaw]}>{profile.status}</Badge>
            <Badge tone={CATEGORY_TONE[profile.category]}>{CATEGORY_LABEL[profile.category]}</Badge>
            {profile.roleName && <Badge tone="brand">{profile.roleName}</Badge>}
          </div>
          <div className="mt-5 space-y-3 text-left">
            {[
              { i: "Hash", l: profile.employeeCode ?? "—" },
              { i: "Mail", l: profile.email },
              { i: "Phone", l: profile.phone ?? "—" },
              { i: "Briefcase", l: profile.department ?? "Unassigned" },
              { i: "Calendar", l: `Joined ${formatDate(profile.joinedAt)}` },
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
          <Card
            title="Personal information"
            action={
              editing && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={cancel} className="btn-ghost h-8 px-3 text-xs">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs disabled:opacity-60"
                  >
                    <Icon name={saving ? "RefreshCw" : "Save"} size={13} className={saving ? "animate-spin" : ""} />
                    Save
                  </button>
                </div>
              )
            }
          >
            {editing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone" htmlFor="me-phone">
                  <Input id="me-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Date of birth" htmlFor="me-dob">
                  <Input id="me-dob" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                </Field>
                <Field label="Gender" htmlFor="me-gender">
                  <Select id="me-gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <option value="">Not specified</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{GENDER_LABEL[g]}</option>
                    ))}
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address" htmlFor="me-address">
                    <Textarea id="me-address" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, city, country" />
                  </Field>
                </div>
                <Field label="Emergency contact name" htmlFor="me-ec-name">
                  <Input id="me-ec-name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
                </Field>
                <Field label="Emergency contact phone" htmlFor="me-ec-phone">
                  <Input id="me-ec-phone" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Info label="Full name" value={profile.name} />
                <Info label="Work email" value={profile.email} />
                <Info label="Phone" value={profile.phone} />
                <Info label="Date of birth" value={formatDate(profile.dateOfBirth)} />
                <Info label="Gender" value={profile.gender ? GENDER_LABEL[profile.gender] : null} />
                <Info label="Address" value={profile.address} />
                <Info label="Emergency contact" value={profile.emergencyContactName} />
                <Info label="Emergency phone" value={profile.emergencyContactPhone} />
              </div>
            )}
          </Card>

          <Card title="Employment details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info label="Employee code" value={profile.employeeCode} />
              <Info label="Designation" value={profile.designation} />
              <Info label="Department" value={profile.department} />
              <Info label="Reporting manager" value={profile.managerName} />
              <Info label="Role" value={profile.roleName} />
              <Info label="Employment type" value={EMPLOYMENT_TYPE_LABEL[profile.employmentType]} />
              <Info label="Date of joining" value={formatDate(profile.joinedAt)} />
              <Info label="Probation end" value={formatDate(profile.probationEndDate)} />
              <Info label="Confirmation date" value={formatDate(profile.confirmationDate)} />
              {profile.category === "CONTRACT" && <Info label="Contract end" value={formatDate(profile.contractEndDate)} />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
