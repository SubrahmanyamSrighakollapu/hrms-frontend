"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABEL,
  GENDERS,
  GENDER_LABEL,
  PROBATION_MONTHS,
  createEmployee,
  toDateInput,
  updateEmployee,
  type Employee,
  type EmployeeCategory,
  type EmployeePayload,
  type EmploymentType,
  type FormOptions,
  type Gender,
} from "@/lib/employees";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  departmentId: string;
  locationId: string;
  subLocationId: string;
  roleId: string;
  managerId: string;
  category: EmployeeCategory;
  employmentType: EmploymentType;
  priorExperienceMonths: string;
  joinedAt: string;
  probationEndDate: string;
  confirmationDate: string;
  contractEndDate: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  password: string;
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  designation: "",
  departmentId: "",
  locationId: "",
  subLocationId: "",
  roleId: "",
  managerId: "",
  category: "FRESHER",
  employmentType: "FULL_TIME",
  priorExperienceMonths: "0",
  joinedAt: new Date().toISOString().slice(0, 10),
  probationEndDate: "",
  confirmationDate: "",
  contractEndDate: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  password: "",
};

function fromEmployee(employee: Employee): FormState {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? "",
    designation: employee.designation ?? "",
    departmentId: employee.departmentId ?? "",
    locationId: employee.locationId ?? "",
    subLocationId: employee.subLocationId ?? "",
    roleId: employee.roleId ?? "",
    managerId: employee.managerId ?? "",
    category: employee.category,
    employmentType: employee.employmentType,
    priorExperienceMonths: String(employee.priorExperienceMonths ?? 0),
    joinedAt: toDateInput(employee.joinedAt),
    probationEndDate: toDateInput(employee.probationEndDate),
    confirmationDate: toDateInput(employee.confirmationDate),
    contractEndDate: toDateInput(employee.contractEndDate),
    dateOfBirth: toDateInput(employee.dateOfBirth),
    gender: employee.gender ?? "",
    address: employee.address ?? "",
    emergencyContactName: employee.emergencyContactName ?? "",
    emergencyContactPhone: employee.emergencyContactPhone ?? "",
    password: "",
  };
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mb-7 last:mb-0">
      <div className="mb-3">
        <h4 className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">{title}</h4>
        {description && <p className="mt-0.5 text-[0.75rem] text-[var(--text-subtle)]">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * The employee creation popup. Doubles as the edit form — pass `employee` to
 * switch modes. On success the parent is handed the saved record (plus the
 * one-time temporary password when the server generated one).
 */
export function EmployeeFormDrawer({
  open,
  onClose,
  employee,
  options,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  options: FormOptions | null;
  onSaved: (result: { employee: Employee; temporaryPassword?: string }) => void;
}) {
  // Only mounted while open, so the form is refilled from scratch each time
  // (and remounted when the drawer switches to a different employee).
  if (!open) return null;
  return (
    <EmployeeFormDrawerForm
      key={employee?.id ?? "create"}
      onClose={onClose}
      employee={employee}
      options={options}
      onSaved={onSaved}
    />
  );
}

function EmployeeFormDrawerForm({
  onClose,
  employee,
  options,
  onSaved,
}: {
  onClose: () => void;
  employee?: Employee | null;
  options: FormOptions | null;
  onSaved: (result: { employee: Employee; temporaryPassword?: string }) => void;
}) {
  const isEdit = !!employee;
  const [form, setForm] = useState<FormState>(() => (employee ? fromEmployee(employee) : EMPTY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Sub-locations are scoped to their parent location; switching location drops
  // a sub-location that no longer belongs.
  const changeLocation = (locationId: string) =>
    setForm((current) => {
      const stillValid = (options?.subLocations ?? []).some(
        (sub) => sub.id === current.subLocationId && sub.locationId === locationId,
      );
      return {
        ...current,
        locationId,
        subLocationId: stillValid ? current.subLocationId : "",
      };
    });

  const locationSubLocations = (options?.subLocations ?? []).filter(
    (sub) => sub.locationId === form.locationId,
  );

  const probationMonths = PROBATION_MONTHS[form.category];
  const probationHint = probationMonths
    ? `Leave blank to set automatically: ${probationMonths} months after the joining date.`
    : "Contract engagements have no probation window.";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("A work email address is required.");
      return;
    }
    if (form.category === "CONTRACT" && !form.contractEndDate) {
      setError("Contract employees need a contract end date.");
      return;
    }
    if (!isEdit && form.password && form.password.length < 8) {
      setError("The password must be at least 8 characters.");
      return;
    }

    const common: EmployeePayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      designation: form.designation.trim() || null,
      departmentId: form.departmentId || null,
      locationId: form.locationId || null,
      subLocationId: form.subLocationId || null,
      roleId: form.roleId || null,
      managerId: form.managerId || null,
      category: form.category,
      employmentType: form.employmentType,
      priorExperienceMonths: Number(form.priorExperienceMonths) || 0,
      joinedAt: form.joinedAt || null,
      confirmationDate: form.confirmationDate || null,
      contractEndDate: form.contractEndDate || null,
      dateOfBirth: form.dateOfBirth || null,
      gender: (form.gender || null) as Gender | null,
      address: form.address.trim() || null,
      emergencyContactName: form.emergencyContactName.trim() || null,
      emergencyContactPhone: form.emergencyContactPhone.trim() || null,
    };

    // Probation is derived server-side, so only send it when it was set by hand.
    if (form.probationEndDate) {
      common.probationEndDate = form.probationEndDate;
    } else if (isEdit && employee?.probationEndDate) {
      common.probationEndDate = null;
    }

    setSaving(true);
    try {
      const result =
        isEdit && employee
          ? await updateEmployee(employee.id, common)
          : await createEmployee({ ...common, password: form.password || undefined });
      onSaved(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${employee?.name}` : "Add employee"}
      subtitle={
        isEdit
          ? "Update the employee's profile, classification and access."
          : "Create a new employee record and grant them access."
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost h-9 px-4 text-[0.84rem]">
            Cancel
          </button>
          <button
            type="submit"
            form="employee-form"
            disabled={saving}
            className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60"
          >
            <Icon name={saving ? "RefreshCw" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
            {isEdit ? "Save changes" : "Create employee"}
          </button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} className="contents">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)] sm:col-span-2">
            <Icon name="AlertCircle" size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Section title="Identity" description="Who the person is and how to reach them.">
          <Field label="First name" required htmlFor="emp-first">
            <Input id="emp-first" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Neha" />
          </Field>
          <Field label="Last name" required htmlFor="emp-last">
            <Input id="emp-last" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Sharma" />
          </Field>
          <Field label="Work email" required htmlFor="emp-email" hint="Also used to sign in.">
            <Input id="emp-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="neha.sharma@company.com" />
          </Field>
          <Field label="Phone" htmlFor="emp-phone">
            <Input id="emp-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Date of birth" htmlFor="emp-dob">
            <Input id="emp-dob" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="Gender" htmlFor="emp-gender">
            <Select id="emp-gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Not specified</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>{GENDER_LABEL[g]}</option>
              ))}
            </Select>
          </Field>
        </Section>

        <Section title="Employment" description="Classification drives the probation window and the employee code.">
          {isEdit && employee?.employeeCode && (
            <Field label="Employee code">
              <Input value={employee.employeeCode} readOnly className="bg-[var(--surface-2)] text-[var(--text-muted)]" />
            </Field>
          )}
          <Field label="Designation" htmlFor="emp-designation">
            <Input id="emp-designation" value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Software Engineer" />
          </Field>
          <Field label="Department" htmlFor="emp-department" hint={!options ? "Loading departments…" : undefined}>
            <Select id="emp-department" value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
              <option value="">Unassigned</option>
              {options?.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.parentName ? `${d.parentName} › ${d.name}` : d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Location" htmlFor="emp-location" hint={!options ? "Loading locations…" : undefined}>
            <Select id="emp-location" value={form.locationId} onChange={(e) => changeLocation(e.target.value)}>
              <option value="">No location</option>
              {options?.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}{l.isDefault ? " (default)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Sub-location"
            htmlFor="emp-sublocation"
            hint={!form.locationId ? "Choose a location first." : undefined}
          >
            <Select
              id="emp-sublocation"
              value={form.subLocationId}
              onChange={(e) => set("subLocationId", e.target.value)}
              disabled={!form.locationId}
            >
              <option value="">No sub-location</option>
              {locationSubLocations.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Category" required htmlFor="emp-category">
            <Select id="emp-category" value={form.category} onChange={(e) => set("category", e.target.value as EmployeeCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Employment type" required htmlFor="emp-type">
            <Select id="emp-type" value={form.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{EMPLOYMENT_TYPE_LABEL[t]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prior experience (months)" htmlFor="emp-prior" hint="Used to understand the background, not for payroll.">
            <Input id="emp-prior" type="number" min={0} value={form.priorExperienceMonths} onChange={(e) => set("priorExperienceMonths", e.target.value)} />
          </Field>
          <Field label="Joining date" htmlFor="emp-joined">
            <Input id="emp-joined" type="date" value={form.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} />
          </Field>
          <Field label="Reporting manager" htmlFor="emp-manager" hint={!options ? "Loading people…" : undefined}>
            <Select id="emp-manager" value={form.managerId} onChange={(e) => set("managerId", e.target.value)}>
              <option value="">No manager</option>
              {options?.managers
                .filter((m) => m.id !== employee?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Role" htmlFor="emp-role" hint="The role decides which modules this employee can access.">
            <Select id="emp-role" value={form.roleId} onChange={(e) => set("roleId", e.target.value)}>
              <option value="">Employee (default)</option>
              {options?.roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          {form.category === "CONTRACT" && (
            <Field label="Contract end date" required htmlFor="emp-contract">
              <Input id="emp-contract" type="date" value={form.contractEndDate} onChange={(e) => set("contractEndDate", e.target.value)} />
            </Field>
          )}
          <Field label="Probation end date" htmlFor="emp-probation" hint={probationHint}>
            <Input id="emp-probation" type="date" value={form.probationEndDate} onChange={(e) => set("probationEndDate", e.target.value)} />
          </Field>
          <Field label="Confirmation date" htmlFor="emp-confirm">
            <Input id="emp-confirm" type="date" value={form.confirmationDate} onChange={(e) => set("confirmationDate", e.target.value)} />
          </Field>
        </Section>

        <Section title="Emergency contact" description="Who to reach in an emergency.">
          <Field label="Contact name" htmlFor="emp-ec-name">
            <Input id="emp-ec-name" value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} placeholder="Aarav Sharma" />
          </Field>
          <Field label="Contact phone" htmlFor="emp-ec-phone">
            <Input id="emp-ec-phone" value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} placeholder="+91 98765 43210" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" htmlFor="emp-address">
              <Textarea id="emp-address" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, city, country" />
            </Field>
          </div>
        </Section>

        {!isEdit && (
          <Section title="Access" description="How the employee first signs in.">
            <div className="sm:col-span-2">
              <Field
                label="Temporary password"
                htmlFor="emp-password"
                hint="Leave blank to generate a secure password. It is shown once after the employee is created."
              >
                <Input
                  id="emp-password"
                  type="text"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Auto-generated"
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </Section>
        )}
      </form>
    </Drawer>
  );
}
