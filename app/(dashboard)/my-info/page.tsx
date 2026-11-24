"use client";

import { useEffect, useState } from "react";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { initials } from "@/lib/rbac";
import { useAuth } from "@/lib/auth-context";
import {
  BLOOD_GROUPS,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  EMPLOYMENT_TYPE_LABEL,
  GENDERS,
  GENDER_LABEL,
  MARITAL_STATUSES,
  MARITAL_STATUS_LABEL,
  STATUS_TONE,
  formatDate,
  getMyProfile,
  toDateInput,
  updateMyProfile,
  type Employee,
  type EmployeePayload,
  type Gender,
  type MaritalStatus,
  // collections
  listWorkExperience,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  listFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  listEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  type WorkExperience,
  type WorkExperienceInput,
  type FamilyMember,
  type FamilyMemberInput,
  type Education,
  type EducationInput,
} from "@/lib/employees";

/* ----------------------------- shared bits ----------------------------- */

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[0.92rem] font-semibold text-[var(--text)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[0.76rem] text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className={`mt-0.5 text-[0.85rem] font-medium text-[var(--text)] ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
      <Icon name={icon} size={26} className="mx-auto text-[var(--brand-300)]" />
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

/* ------------------------------ the page ------------------------------- */

type TabId = "core" | "bank" | "experience" | "family" | "education" | "emergency";

interface CoreForm {
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bloodGroup: string;
  maritalStatus: string;
}

interface BankForm {
  bankName: string;
  bankAccount: string;
  ifsc: string;
  pan: string;
  aadhaar: string;
  uan: string;
}

interface EmergencyForm {
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

export default function MyInfoPage() {
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can("my-info", "MANAGE");

  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("core");

  // collections
  const [work, setWork] = useState<WorkExperience[]>([]);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [education, setEducation] = useState<Education[]>([]);

  // editing states per section
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [coreForm, setCoreForm] = useState<CoreForm>({
    phone: "", dateOfBirth: "", gender: "", address: "", bloodGroup: "", maritalStatus: "",
  });
  const [bankForm, setBankForm] = useState<BankForm>({
    bankName: "", bankAccount: "", ifsc: "", pan: "", aadhaar: "", uan: "",
  });
  const [emergencyForm, setEmergencyForm] = useState<EmergencyForm>({
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelationship: "",
  });

  // modals
  const [workModal, setWorkModal] = useState<{ open: boolean; editing: WorkExperience | null }>({
    open: false,
    editing: null,
  });
  const [familyModal, setFamilyModal] = useState<{ open: boolean; editing: FamilyMember | null }>({
    open: false,
    editing: null,
  });
  const [eduModal, setEduModal] = useState<{ open: boolean; editing: Education | null }>({
    open: false,
    editing: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "work" | "family" | "education"; id: string } | null>(null);

  const onboarded = profile?.onboardingCompleted ?? false;
  const editsEnabled = canEdit && onboarded;

  /* ----------------------------- data load ---------------------------- */

  useEffect(() => {
    let active = true;
    Promise.all([getMyProfile(), listWorkExperience(), listFamilyMembers(), listEducation()])
      .then(([me, w, f, e]) => {
        if (!active) return;
        setProfile(me.employee);
        setWork(w);
        setFamily(f);
        setEducation(e);
        setError(null);
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

  const applyProfile = (employee: Employee) => {
    setProfile(employee);
  };

  /* --------------------------- core / bank / emergency ------------------------ */

  const startCoreEdit = () => {
    if (!profile) return;
    setCoreForm({
      phone: profile.phone ?? "",
      dateOfBirth: toDateInput(profile.dateOfBirth),
      gender: profile.gender ?? "",
      address: profile.address ?? "",
      bloodGroup: profile.bloodGroup ?? "",
      maritalStatus: profile.maritalStatus ?? "",
    });
    setEditing((s) => ({ ...s, core: true }));
  };

  const startBankEdit = () => {
    if (!profile) return;
    setBankForm({
      bankName: profile.bankName ?? "",
      bankAccount: profile.bankAccount ?? "",
      ifsc: profile.ifsc ?? "",
      pan: profile.pan ?? "",
      aadhaar: profile.aadhaar ?? "",
      uan: profile.uan ?? "",
    });
    setEditing((s) => ({ ...s, bank: true }));
  };

  const startEmergencyEdit = () => {
    if (!profile) return;
    setEmergencyForm({
      emergencyContactName: profile.emergencyContactName ?? "",
      emergencyContactPhone: profile.emergencyContactPhone ?? "",
      emergencyContactRelationship: profile.emergencyContactRelationship ?? "",
    });
    setEditing((s) => ({ ...s, emergency: true }));
  };

  const cancelEdit = (key: string) => {
    setEditing((s) => ({ ...s, [key]: false }));
  };

  const saveCore = async () => {
    if (!profile) return;
    setSaving((s) => ({ ...s, core: true }));
    try {
      const payload: EmployeePayload = {
        phone: (coreForm.phone as string)?.trim() || null,
        dateOfBirth: (coreForm.dateOfBirth as string) || null,
        gender: (coreForm.gender as Gender | null) || null,
        address: (coreForm.address as string)?.trim() || null,
        bloodGroup: (coreForm.bloodGroup as string)?.trim() || null,
        maritalStatus: (coreForm.maritalStatus as MaritalStatus | null) || null,
      };
      const result = await updateMyProfile(payload);
      applyProfile(result.employee);
      setEditing((s) => ({ ...s, core: false }));
      toast.success("Core information updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your details.");
    } finally {
      setSaving((s) => ({ ...s, core: false }));
    }
  };

  const saveBank = async () => {
    if (!profile) return;
    setSaving((s) => ({ ...s, bank: true }));
    try {
      const payload: EmployeePayload = {
        bankName: (bankForm.bankName as string)?.trim() || null,
        bankAccount: (bankForm.bankAccount as string)?.trim() || null,
        ifsc: (bankForm.ifsc as string)?.trim() || null,
        pan: (bankForm.pan as string)?.trim() || null,
        aadhaar: (bankForm.aadhaar as string)?.trim() || null,
        uan: (bankForm.uan as string)?.trim() || null,
      };
      const result = await updateMyProfile(payload);
      applyProfile(result.employee);
      setEditing((s) => ({ ...s, bank: false }));
      toast.success("Bank details updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save bank details.");
    } finally {
      setSaving((s) => ({ ...s, bank: false }));
    }
  };

  const saveEmergency = async () => {
    if (!profile) return;
    setSaving((s) => ({ ...s, emergency: true }));
    try {
      const payload: EmployeePayload = {
        emergencyContactName: (emergencyForm.emergencyContactName as string)?.trim() || null,
        emergencyContactPhone: (emergencyForm.emergencyContactPhone as string)?.trim() || null,
        emergencyContactRelationship: (emergencyForm.emergencyContactRelationship as string)?.trim() || null,
      };
      const result = await updateMyProfile(payload);
      applyProfile(result.employee);
      setEditing((s) => ({ ...s, emergency: false }));
      toast.success("Emergency contact updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save emergency contact.");
    } finally {
      setSaving((s) => ({ ...s, emergency: false }));
    }
  };

  /* ----------------------------- work experience --------------------------- */

  const [workForm, setWorkForm] = useState<WorkExperienceInput>({
    company: "",
    designation: "",
    fromDate: "",
    toDate: "",
    currentlyWorking: false,
    description: "",
  });

  const openWorkCreate = () => {
    setWorkForm({ company: "", designation: "", fromDate: "", toDate: "", currentlyWorking: false, description: "" });
    setWorkModal({ open: true, editing: null });
  };

  const openWorkEdit = (item: WorkExperience) => {
    setWorkForm({
      company: item.company,
      designation: item.designation ?? "",
      fromDate: toDateInput(item.fromDate),
      toDate: item.toDate ? toDateInput(item.toDate) : "",
      currentlyWorking: item.currentlyWorking,
      description: item.description ?? "",
    });
    setWorkModal({ open: true, editing: item });
  };

  const saveWork = async () => {
    if (!workForm.company.trim() || !workForm.fromDate) return;
    const payload: WorkExperienceInput = {
      ...workForm,
      designation: workForm.designation?.trim() || null,
      toDate: workForm.currentlyWorking ? null : workForm.toDate || null,
      description: workForm.description?.trim() || null,
    };
    try {
      if (workModal.editing) {
        await updateWorkExperience(workModal.editing.id, payload);
        toast.success("Work experience updated.");
      } else {
        await createWorkExperience(payload);
        toast.success("Work experience added.");
      }
      setWorkModal({ open: false, editing: null });
      setWork(await listWorkExperience());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save work experience.");
    }
  };

  /* ------------------------------ family members --------------------------- */

  const [familyForm, setFamilyForm] = useState<FamilyMemberInput>({
    name: "",
    relationship: "",
    dateOfBirth: "",
    phone: "",
  });

  const openFamilyCreate = () => {
    setFamilyForm({ name: "", relationship: "", dateOfBirth: "", phone: "" });
    setFamilyModal({ open: true, editing: null });
  };

  const openFamilyEdit = (item: FamilyMember) => {
    setFamilyForm({
      name: item.name,
      relationship: item.relationship,
      dateOfBirth: item.dateOfBirth ? toDateInput(item.dateOfBirth) : "",
      phone: item.phone ?? "",
    });
    setFamilyModal({ open: true, editing: item });
  };

  const saveFamily = async () => {
    if (!familyForm.name.trim() || !familyForm.relationship.trim()) return;
    const payload: FamilyMemberInput = {
      ...familyForm,
      dateOfBirth: familyForm.dateOfBirth || null,
      phone: familyForm.phone?.trim() || null,
    };
    try {
      if (familyModal.editing) {
        await updateFamilyMember(familyModal.editing.id, payload);
        toast.success("Family member updated.");
      } else {
        await createFamilyMember(payload);
        toast.success("Family member added.");
      }
      setFamilyModal({ open: false, editing: null });
      setFamily(await listFamilyMembers());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save family member.");
    }
  };

  /* -------------------------------- education ------------------------------ */

  const [eduForm, setEduForm] = useState<EducationInput>({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    fromYear: new Date().getFullYear(),
    toYear: null,
    percentage: null,
  });

  const openEduCreate = () => {
    setEduForm({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      fromYear: new Date().getFullYear(),
      toYear: null,
      percentage: null,
    });
    setEduModal({ open: true, editing: null });
  };

  const openEduEdit = (item: Education) => {
    setEduForm({
      institution: item.institution,
      degree: item.degree,
      fieldOfStudy: item.fieldOfStudy ?? "",
      fromYear: item.fromYear,
      toYear: item.toYear,
      percentage: item.percentage,
    });
    setEduModal({ open: true, editing: item });
  };

  const saveEdu = async () => {
    if (!eduForm.institution.trim() || !eduForm.degree.trim()) return;
    const payload: EducationInput = {
      ...eduForm,
      fieldOfStudy: eduForm.fieldOfStudy?.trim() || null,
      toYear: eduForm.toYear ?? null,
      percentage: eduForm.percentage ?? null,
    };
    try {
      if (eduModal.editing) {
        await updateEducation(eduModal.editing.id, payload);
        toast.success("Education record updated.");
      } else {
        await createEducation(payload);
        toast.success("Education record added.");
      }
      setEduModal({ open: false, editing: null });
      setEducation(await listEducation());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save education record.");
    }
  };

  /* ------------------------------- delete --------------------------------- */

  const runDelete = async () => {
    if (!confirmDelete) return;
    const { kind, id } = confirmDelete;
    try {
      if (kind === "work") {
        await deleteWorkExperience(id);
        setWork((list) => list.filter((i) => i.id !== id));
      } else if (kind === "family") {
        await deleteFamilyMember(id);
        setFamily((list) => list.filter((i) => i.id !== id));
      } else {
        await deleteEducation(id);
        setEducation((list) => list.filter((i) => i.id !== id));
      }
      toast.success("Record deleted.");
      setConfirmDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete record.");
    }
  };

  /* -------------------------------- render -------------------------------- */

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

  const tabs = [
    { id: "core", label: "Core Info" },
    { id: "bank", label: "Bank Account" },
    { id: "experience", label: "Work Experience", count: work.length },
    { id: "family", label: "Family", count: family.length },
    { id: "education", label: "Education", count: education.length },
    { id: "emergency", label: "Emergency Contact" },
  ];

  return (
    <div>
      <PageHeader title="My Info" subtitle="Your personal and employment details" />

      {/* Onboarding gate banner */}
      {!onboarded && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--warning-bg)] bg-[var(--warning-bg)] p-4">
          <Icon name="AlertTriangle" size={20} className="mt-0.5 flex-shrink-0 text-[var(--warning)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Onboarding not completed</p>
            <p className="mt-0.5 text-[0.8rem] text-[var(--text-muted)]">
              You can view your information, but editing is locked until HR completes your onboarding.
            </p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-2xl font-bold text-[var(--brand-700)]">
          {initials(profile.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[var(--text)]">{profile.name}</h2>
          <p className="text-sm text-[var(--text-muted)]">{profile.designation ?? "No designation"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[profile.statusRaw]}>{profile.status}</Badge>
            <Badge tone={CATEGORY_TONE[profile.category]}>{CATEGORY_LABEL[profile.category]}</Badge>
            {profile.roleName && <Badge tone="brand">{profile.roleName}</Badge>}
            {onboarded ? (
              <Badge tone="success">Onboarded</Badge>
            ) : (
              <Badge tone="warning">Pending onboarding</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <div className="text-xs text-[var(--text-muted)]">Employee code</div>
            <div className="font-mono font-medium text-[var(--text)]">{profile.employeeCode ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)]">Department</div>
            <div className="font-medium text-[var(--text)]">{profile.department ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)]">Location</div>
            <div className="font-medium text-[var(--text)]">{profile.location ?? "—"}</div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} initial="core" onChange={(id) => setTab(id as TabId)} />

      <div className="mt-5">
        {/* ------------------------- CORE INFO ------------------------- */}
        {tab === "core" && (
          <Card
            title="Core information"
            subtitle="Personal details used across the system"
            action={
              !editing.core && editsEnabled ? (
                <button
                  type="button"
                  onClick={startCoreEdit}
                  className="btn-ghost inline-flex h-8 items-center gap-1.5 px-3 text-xs"
                >
                  <Icon name="Pencil" size={13} /> Edit
                </button>
              ) : editing.core ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cancelEdit("core")} className="btn-ghost h-8 px-3 text-xs">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveCore}
                    disabled={saving.core}
                    className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs disabled:opacity-60"
                  >
                    <Icon name={saving.core ? "RefreshCw" : "Save"} size={13} className={saving.core ? "animate-spin" : ""} />
                    Save
                  </button>
                </div>
              ) : null
            }
          >
            {editing.core ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  <Input value={(coreForm.phone as string) ?? ""} onChange={(e) => setCoreForm({ ...coreForm, phone: e.target.value })} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Date of birth">
                  <Input type="date" value={(coreForm.dateOfBirth as string) ?? ""} onChange={(e) => setCoreForm({ ...coreForm, dateOfBirth: e.target.value })} />
                </Field>
                <Field label="Gender">
                  <Select value={(coreForm.gender as string) ?? ""} onChange={(e) => setCoreForm({ ...coreForm, gender: e.target.value })}>
                    <option value="">Not specified</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{GENDER_LABEL[g]}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Blood group">
                  <Select value={(coreForm.bloodGroup as string) ?? ""} onChange={(e) => setCoreForm({ ...coreForm, bloodGroup: e.target.value })}>
                    <option value="">Not specified</option>
                    {BLOOD_GROUPS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Marital status">
                  <Select value={(coreForm.maritalStatus as string) ?? ""} onChange={(e) => setCoreForm({ ...coreForm, maritalStatus: e.target.value })}>
                    <option value="">Not specified</option>
                    {MARITAL_STATUSES.map((m) => (
                      <option key={m} value={m}>{MARITAL_STATUS_LABEL[m]}</option>
                    ))}
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Textarea rows={2} value={(coreForm.address as string) ?? ""} onChange={(e) => setCoreForm({ ...coreForm, address: e.target.value })} placeholder="Street, city, country" />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Info label="Full name" value={profile.name} />
                <Info label="Work email" value={profile.email} />
                <Info label="Phone" value={profile.phone} />
                <Info label="Date of birth" value={formatDate(profile.dateOfBirth)} />
                <Info label="Gender" value={profile.gender ? GENDER_LABEL[profile.gender] : null} />
                <Info label="Blood group" value={profile.bloodGroup} />
                <Info label="Marital status" value={profile.maritalStatus ? MARITAL_STATUS_LABEL[profile.maritalStatus] : null} />
                <Info label="Address" value={profile.address} />
              </div>
            )}
          </Card>
        )}

        {/* ------------------------- BANK ACCOUNT ------------------------- */}
        {tab === "bank" && (
          <Card
            title="Bank account details"
            subtitle="Used for payroll disbursement and statutory filings"
            action={
              !editing.bank && editsEnabled ? (
                <button type="button" onClick={startBankEdit} className="btn-ghost inline-flex h-8 items-center gap-1.5 px-3 text-xs">
                  <Icon name="Pencil" size={13} /> Edit
                </button>
              ) : editing.bank ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cancelEdit("bank")} className="btn-ghost h-8 px-3 text-xs">Cancel</button>
                  <button type="button" onClick={saveBank} disabled={saving.bank} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs disabled:opacity-60">
                    <Icon name={saving.bank ? "RefreshCw" : "Save"} size={13} className={saving.bank ? "animate-spin" : ""} /> Save
                  </button>
                </div>
              ) : null
            }
          >
            {editing.bank ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Bank name">
                  <Input value={(bankForm.bankName as string) ?? ""} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} maxLength={100} />
                </Field>
                <Field label="Account number">
                  <Input value={(bankForm.bankAccount as string) ?? ""} onChange={(e) => setBankForm({ ...bankForm, bankAccount: e.target.value })} maxLength={30} />
                </Field>
                <Field label="IFSC code">
                  <Input value={(bankForm.ifsc as string) ?? ""} onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })} maxLength={20} />
                </Field>
                <Field label="PAN">
                  <Input value={(bankForm.pan as string) ?? ""} onChange={(e) => setBankForm({ ...bankForm, pan: e.target.value })} maxLength={20} />
                </Field>
                <Field label="Aadhaar">
                  <Input value={(bankForm.aadhaar as string) ?? ""} onChange={(e) => setBankForm({ ...bankForm, aadhaar: e.target.value })} maxLength={20} />
                </Field>
                <Field label="UAN">
                  <Input value={(bankForm.uan as string) ?? ""} onChange={(e) => setBankForm({ ...bankForm, uan: e.target.value })} maxLength={20} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Info label="Bank name" value={profile.bankName} />
                <Info label="Account number" value={profile.bankAccount} mono />
                <Info label="IFSC code" value={profile.ifsc} mono />
                <Info label="PAN" value={profile.pan} mono />
                <Info label="Aadhaar" value={profile.aadhaar} mono />
                <Info label="UAN" value={profile.uan} mono />
              </div>
            )}
          </Card>
        )}

        {/* ----------------------- WORK EXPERIENCE ----------------------- */}
        {tab === "experience" && (
          <Card
            title="Work experience"
            subtitle="Your previous roles and employers"
            action={
              editsEnabled ? (
                <button type="button" onClick={openWorkCreate} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs">
                  <Icon name="Plus" size={13} /> Add
                </button>
              ) : null
            }
          >
            {work.length ? (
              <div className="space-y-3">
                {work.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text)]">{item.company}</p>
                        {item.designation && (
                          <p className="text-sm text-[var(--text-muted)]">{item.designation}</p>
                        )}
                        <p className="mt-1 text-xs text-[var(--text-subtle)]">
                          {formatDate(item.fromDate)} — {item.currentlyWorking ? "Present" : formatDate(item.toDate)}
                          {item.currentlyWorking && <Badge tone="success" >Current</Badge>}
                        </p>
                        {item.description && (
                          <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
                        )}
                      </div>
                      {editsEnabled && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openWorkEdit(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                            aria-label="Edit work experience"
                          >
                            <Icon name="Pencil" size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ kind: "work", id: item.id })}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                            aria-label="Delete work experience"
                          >
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="Briefcase" title="No work experience yet" hint="Add your previous roles to complete your profile." />
            )}
          </Card>
        )}

        {/* ------------------------- FAMILY MEMBERS ------------------------- */}
        {tab === "family" && (
          <Card
            title="Family members"
            subtitle="People you would like us to contact in case of need"
            action={
              editsEnabled ? (
                <button type="button" onClick={openFamilyCreate} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs">
                  <Icon name="Plus" size={13} /> Add
                </button>
              ) : null
            }
          >
            {family.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {family.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text)]">{item.name}</p>
                        <p className="text-sm text-[var(--text-muted)]">{item.relationship}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--text-subtle)]">
                          {item.dateOfBirth && <span>DOB: {formatDate(item.dateOfBirth)}</span>}
                          {item.phone && <span>{item.phone}</span>}
                        </div>
                      </div>
                      {editsEnabled && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openFamilyEdit(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                            aria-label="Edit family member"
                          >
                            <Icon name="Pencil" size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ kind: "family", id: item.id })}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                            aria-label="Delete family member"
                          >
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="Users" title="No family members added" hint="Add family members to keep their records with you." />
            )}
          </Card>
        )}

        {/* ---------------------------- EDUCATION ---------------------------- */}
        {tab === "education" && (
          <Card
            title="Education"
            subtitle="Your academic qualifications"
            action={
              editsEnabled ? (
                <button type="button" onClick={openEduCreate} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs">
                  <Icon name="Plus" size={13} /> Add
                </button>
              ) : null
            }
          >
            {education.length ? (
              <div className="space-y-3">
                {education.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text)]">{item.degree}</p>
                        <p className="text-sm text-[var(--text-muted)]">{item.institution}</p>
                        {item.fieldOfStudy && (
                          <p className="mt-0.5 text-xs text-[var(--text-subtle)]">Field: {item.fieldOfStudy}</p>
                        )}
                        <p className="mt-1 text-xs text-[var(--text-subtle)]">
                          {item.fromYear} – {item.toYear ?? "Present"}
                          {item.percentage != null && <> • {item.percentage}%</>}
                        </p>
                      </div>
                      {editsEnabled && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEduEdit(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                            aria-label="Edit education"
                          >
                            <Icon name="Pencil" size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ kind: "education", id: item.id })}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                            aria-label="Delete education"
                          >
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="GraduationCap" title="No education records" hint="Add your degrees and institutions." />
            )}
          </Card>
        )}

        {/* ------------------------- EMERGENCY CONTACT ------------------------- */}
        {tab === "emergency" && (
          <Card
            title="Emergency contact"
            subtitle="Who we should reach out to in an emergency"
            action={
              !editing.emergency && editsEnabled ? (
                <button type="button" onClick={startEmergencyEdit} className="btn-ghost inline-flex h-8 items-center gap-1.5 px-3 text-xs">
                  <Icon name="Pencil" size={13} /> Edit
                </button>
              ) : editing.emergency ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cancelEdit("emergency")} className="btn-ghost h-8 px-3 text-xs">Cancel</button>
                  <button type="button" onClick={saveEmergency} disabled={saving.emergency} className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-xs disabled:opacity-60">
                    <Icon name={saving.emergency ? "RefreshCw" : "Save"} size={13} className={saving.emergency ? "animate-spin" : ""} /> Save
                  </button>
                </div>
              ) : null
            }
          >
            {editing.emergency ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Contact name">
                  <Input value={(emergencyForm.emergencyContactName as string) ?? ""} onChange={(e) => setEmergencyForm({ ...emergencyForm, emergencyContactName: e.target.value })} maxLength={80} />
                </Field>
                <Field label="Phone">
                  <Input value={(emergencyForm.emergencyContactPhone as string) ?? ""} onChange={(e) => setEmergencyForm({ ...emergencyForm, emergencyContactPhone: e.target.value })} maxLength={20} />
                </Field>
                <Field label="Relationship">
                  <Input value={(emergencyForm.emergencyContactRelationship as string) ?? ""} onChange={(e) => setEmergencyForm({ ...emergencyForm, emergencyContactRelationship: e.target.value })} maxLength={40} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Info label="Contact name" value={profile.emergencyContactName} />
                <Info label="Phone" value={profile.emergencyContactPhone} />
                <Info label="Relationship" value={profile.emergencyContactRelationship} />
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ----------------------------- Work modal ----------------------------- */}
      <Modal
        open={workModal.open}
        onClose={() => setWorkModal({ open: false, editing: null })}
        title={workModal.editing ? "Edit work experience" : "Add work experience"}
        footer={
          <>
            <button onClick={() => setWorkModal({ open: false, editing: null })} className="btn-ghost px-3 py-2 text-sm">Cancel</button>
            <button
              onClick={saveWork}
              disabled={!workForm.company.trim() || !workForm.fromDate}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {workModal.editing ? "Save changes" : "Add experience"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Company" required>
            <Input value={workForm.company} onChange={(e) => setWorkForm({ ...workForm, company: e.target.value })} maxLength={120} />
          </Field>
          <Field label="Designation">
            <Input value={workForm.designation ?? ""} onChange={(e) => setWorkForm({ ...workForm, designation: e.target.value })} maxLength={80} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="From" required>
              <Input type="date" value={workForm.fromDate} onChange={(e) => setWorkForm({ ...workForm, fromDate: e.target.value })} />
            </Field>
            <Field label="To">
              <Input type="date" value={workForm.toDate ?? ""} onChange={(e) => setWorkForm({ ...workForm, toDate: e.target.value })} disabled={workForm.currentlyWorking} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text)]">
            <input
              type="checkbox"
              checked={!!workForm.currentlyWorking}
              onChange={(e) => setWorkForm({ ...workForm, currentlyWorking: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border)] text-[var(--brand-600)]"
            />
            I currently work here
          </label>
          <Field label="Description">
            <Textarea rows={3} value={workForm.description ?? ""} onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })} maxLength={500} />
          </Field>
        </div>
      </Modal>

      {/* ----------------------------- Family modal ----------------------------- */}
      <Modal
        open={familyModal.open}
        onClose={() => setFamilyModal({ open: false, editing: null })}
        title={familyModal.editing ? "Edit family member" : "Add family member"}
        footer={
          <>
            <button onClick={() => setFamilyModal({ open: false, editing: null })} className="btn-ghost px-3 py-2 text-sm">Cancel</button>
            <button
              onClick={saveFamily}
              disabled={!familyForm.name.trim() || !familyForm.relationship.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {familyModal.editing ? "Save changes" : "Add member"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Name" required>
            <Input value={familyForm.name} onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} maxLength={80} />
          </Field>
          <Field label="Relationship" required>
            <Input value={familyForm.relationship} onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })} maxLength={40} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date of birth">
              <Input type="date" value={familyForm.dateOfBirth ?? ""} onChange={(e) => setFamilyForm({ ...familyForm, dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={familyForm.phone ?? ""} onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })} maxLength={20} />
            </Field>
          </div>
        </div>
      </Modal>

      {/* ----------------------------- Education modal ----------------------------- */}
      <Modal
        open={eduModal.open}
        onClose={() => setEduModal({ open: false, editing: null })}
        title={eduModal.editing ? "Edit education" : "Add education"}
        footer={
          <>
            <button onClick={() => setEduModal({ open: false, editing: null })} className="btn-ghost px-3 py-2 text-sm">Cancel</button>
            <button
              onClick={saveEdu}
              disabled={!eduForm.institution.trim() || !eduForm.degree.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {eduModal.editing ? "Save changes" : "Add education"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Institution" required>
            <Input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} maxLength={160} />
          </Field>
          <Field label="Degree" required>
            <Input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} maxLength={120} />
          </Field>
          <Field label="Field of study">
            <Input value={eduForm.fieldOfStudy ?? ""} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} maxLength={120} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="From year" required>
              <Input type="number" min={1900} max={2100} value={eduForm.fromYear} onChange={(e) => setEduForm({ ...eduForm, fromYear: Number(e.target.value) })} />
            </Field>
            <Field label="To year">
              <Input type="number" min={1900} max={2100} value={eduForm.toYear ?? ""} onChange={(e) => setEduForm({ ...eduForm, toYear: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Percentage">
              <Input type="number" min={0} max={100} step="0.01" value={eduForm.percentage ?? ""} onChange={(e) => setEduForm({ ...eduForm, percentage: e.target.value ? Number(e.target.value) : null })} />
            </Field>
          </div>
        </div>
      </Modal>

      {/* ----------------------------- Delete confirm ----------------------------- */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this record?"
        tone="danger"
        description="This action cannot be undone."
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="btn-ghost px-3 py-2 text-sm">Cancel</button>
            <button onClick={runDelete} className="btn-danger px-4 py-2 text-sm">Delete</button>
          </>
        }
      />
    </div>
  );
}
