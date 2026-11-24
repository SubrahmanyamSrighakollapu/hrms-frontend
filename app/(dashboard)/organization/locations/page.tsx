"use client";

import { useCallback, useEffect, useState } from "react";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  createLocation,
  deleteLocation,
  listLocations,
  updateLocation,
  type Location,
  type LocationInput,
  type RecordStatus,
} from "@/lib/organization";
import { useAuth } from "@/lib/auth-context";

const STATUS_OPTIONS: { value: RecordStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

function emptyForm(): LocationInput {
  return {
    name: "",
    code: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    timezone: "Asia/Kolkata",
    workStart: "09:00",
    workEnd: "18:00",
    isDefault: false,
    status: "ACTIVE",
  };
}

export default function LocationsPage() {
  const toast = useToast();
  const { can } = useAuth();
  const canManage = can("organization", "MANAGE");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationInput>(emptyForm());

  const refresh = useCallback(async () => {
    const result = await listLocations();
    setLocations(result);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    listLocations()
      .then((result) => {
        if (active) {
          setLocations(result);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load locations");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (location: Location) => {
    setEditing(location);
    setForm({
      name: location.name,
      code: location.code,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      state: location.state,
      country: location.country,
      postalCode: location.postalCode,
      timezone: location.timezone,
      workStart: location.workStart,
      workEnd: location.workEnd,
      isDefault: location.isDefault,
      status: location.status,
    });
    setModalOpen(true);
  };

  const set = <K extends keyof LocationInput>(key: K, value: LocationInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateLocation(editing.id, form);
      else await createLocation(form);
      await refresh();
      setModalOpen(false);
      toast.success(editing ? "Location updated" : "Location created");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save location");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (location: Location) => {
    try {
      await updateLocation(location.id, { isDefault: true });
      await refresh();
      toast.success(`${location.name} is now the default location`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not set default location");
    }
  };

  const toggleStatus = async (location: Location) => {
    try {
      const next: RecordStatus = location.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateLocation(location.id, { status: next });
      await refresh();
      toast.success(`Location marked ${next === "ACTIVE" ? "active" : "inactive"}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update location status");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteLocation(deleting.id);
      await refresh();
      toast.success("Location deleted");
      setDeleting(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete location");
    }
  };

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Office locations and their operating details"
        actions={
          canManage && (
            <button
              onClick={openCreate}
              className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-sm"
            >
              <Icon name="Plus" size={15} /> Add location
            </button>
          )
        }
      />

      {error ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-[var(--text)]">Locations could not be loaded</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); setRetry((v) => v + 1); }}
            className="btn-primary mt-4 px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading locations…</div>
      ) : locations.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <article key={location.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]">
                    <Icon name="MapPin" size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-[var(--text)]">{location.name}</h2>
                      {location.isDefault && <Badge tone="brand">Default</Badge>}
                    </div>
                    {location.code && (
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-subtle)]">
                        {location.code}
                      </p>
                    )}
                  </div>
                </div>
                {canManage && (
                  <Dropdown
                    trigger={({ toggle }) => (
                      <button
                        type="button"
                        onClick={toggle}
                        aria-label={`Actions for ${location.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                      >
                        <Icon name="MoreVertical" size={16} />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <DropdownItem icon="Pencil" onClick={() => { close(); openEdit(location); }}>
                          Edit location
                        </DropdownItem>
                        {!location.isDefault && (
                          <DropdownItem icon="Star" onClick={() => { close(); setDefault(location); }}>
                            Set as default
                          </DropdownItem>
                        )}
                        <DropdownItem
                          icon={location.status === "ACTIVE" ? "PauseCircle" : "PlayCircle"}
                          onClick={() => { close(); toggleStatus(location); }}
                        >
                          {location.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </DropdownItem>
                        <DropdownItem
                          icon="Trash2"
                          danger
                          disabled={location.employeeCount > 0 || location.departmentCount > 0}
                          onClick={() => { close(); setDeleting(location); }}
                        >
                          Delete location
                        </DropdownItem>
                      </>
                    )}
                  </Dropdown>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge tone={location.status === "ACTIVE" ? "success" : "muted"}>
                  {location.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
                {location.timezone && (
                  <span className="text-[0.72rem] text-[var(--text-subtle)]">{location.timezone}</span>
                )}
              </div>

              {(location.addressLine1 || location.city || location.country) && (
                <p className="mt-3 text-sm text-[var(--text-muted)] line-clamp-2">
                  {[location.addressLine1, location.addressLine2, location.city, location.state, location.country, location.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-center">
                <div>
                  <div className="text-lg font-bold text-[var(--text)]">{location.employeeCount}</div>
                  <div className="text-[0.7rem] text-[var(--text-subtle)]">Employees</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--text)]">{location.departmentCount}</div>
                  <div className="text-[0.7rem] text-[var(--text-subtle)]">Departments</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--text)]">{location.subLocationCount}</div>
                  <div className="text-[0.7rem] text-[var(--text-subtle)]">Sub-locations</div>
                </div>
              </div>

              {(location.workStart || location.workEnd) && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-subtle)]">
                  <Icon name="Clock" size={13} />
                  <span>
                    {location.workStart ?? "—"} – {location.workEnd ?? "—"}
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <Icon name="MapPin" size={30} className="mx-auto text-[var(--brand-300)]" />
          <p className="mt-3 font-medium text-[var(--text)]">No locations yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Create a location to organize offices and employees.</p>
          {canManage && (
            <button onClick={openCreate} className="btn-primary mt-4 px-4 py-2 text-sm">
              Add location
            </button>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit location" : "Add location"}
        description="Location details are shared with employee and department records."
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-ghost px-3 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name?.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create location"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name" required>
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} maxLength={100} />
            </Field>
            <Field label="Code">
              <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value || null)} maxLength={16} />
            </Field>
          </div>
          <Field label="Address line 1">
            <Input value={form.addressLine1 ?? ""} onChange={(e) => set("addressLine1", e.target.value || null)} maxLength={160} />
          </Field>
          <Field label="Address line 2">
            <Input value={form.addressLine2 ?? ""} onChange={(e) => set("addressLine2", e.target.value || null)} maxLength={160} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="City">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value || null)} maxLength={80} />
            </Field>
            <Field label="State">
              <Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value || null)} maxLength={80} />
            </Field>
            <Field label="Country">
              <Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value || null)} maxLength={80} />
            </Field>
            <Field label="Postal code">
              <Input value={form.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value || null)} maxLength={20} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Timezone">
              <Select value={form.timezone ?? "Asia/Kolkata"} onChange={(e) => set("timezone", e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </Select>
            </Field>
            <Field label="Work start">
              <Input type="time" value={form.workStart ?? ""} onChange={(e) => set("workStart", e.target.value || null)} />
            </Field>
            <Field label="Work end">
              <Input type="time" value={form.workEnd ?? ""} onChange={(e) => set("workEnd", e.target.value || null)} />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Default location</p>
              <p className="text-[0.72rem] text-[var(--text-subtle)]">Used when no location is specified for an employee.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!form.isDefault}
              onClick={() => set("isDefault", !form.isDefault)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isDefault ? "bg-[var(--brand-600)]" : "bg-[var(--surface-3)]"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isDefault ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <Field label="Status">
            <Select value={form.status ?? "ACTIVE"} onChange={(e) => set("status", e.target.value as RecordStatus)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete location?"
        description={`Delete ${deleting?.name ?? "this location"}? This cannot be undone.`}
        tone="danger"
        footer={
          <>
            <button onClick={() => setDeleting(null)} className="btn-ghost px-3 py-2 text-sm">
              Cancel
            </button>
            <button onClick={remove} className="btn-danger px-4 py-2 text-sm">
              Delete
            </button>
          </>
        }
      />
    </div>
  );
}
