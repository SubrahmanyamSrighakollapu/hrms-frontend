"use client";

import { useCallback, useEffect, useState } from "react";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  createSubLocation,
  deleteSubLocation,
  listLocations,
  listSubLocations,
  updateSubLocation,
  SUB_LOCATION_TYPE_LABEL,
  SUB_LOCATION_TYPES,
  type Location,
  type RecordStatus,
  type SubLocation,
  type SubLocationInput,
  type SubLocationType,
} from "@/lib/organization";
import { useAuth } from "@/lib/auth-context";

const STATUS_OPTIONS: { value: RecordStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

function emptyForm(locationId: string): SubLocationInput {
  return {
    locationId,
    name: "",
    type: "FLOOR",
    code: "",
    status: "ACTIVE",
  };
}

export default function SubLocationsPage() {
  const toast = useToast();
  const { can } = useAuth();
  const canManage = can("organization", "MANAGE");
  const [locations, setLocations] = useState<Location[]>([]);
  const [subLocations, setSubLocations] = useState<SubLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SubLocation | null>(null);
  const [deleting, setDeleting] = useState<SubLocation | null>(null);
  const [form, setForm] = useState<SubLocationInput>(emptyForm(""));

  const refresh = useCallback(async () => {
    const result = await listSubLocations(selectedLocation || undefined);
    setSubLocations(result);
    setError(null);
  }, [selectedLocation]);

  useEffect(() => {
    let active = true;
    listLocations()
      .then((locs) => {
        if (active) {
          setLocations(locs);
          // Pre-select the default location, if any.
          const def = locs.find((l) => l.isDefault) ?? locs[0];
          if (def) setSelectedLocation(def.id);
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

  useEffect(() => {
    if (!selectedLocation) return;
    let active = true;
    listSubLocations(selectedLocation)
      .then((result) => {
        if (active) {
          setSubLocations(result);
          setError(null);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load sub-locations");
      });
    return () => {
      active = false;
    };
  }, [selectedLocation]);

  const openCreate = () => {
    if (!selectedLocation) {
      toast.error("Select a location first");
      return;
    }
    setEditing(null);
    setForm(emptyForm(selectedLocation));
    setModalOpen(true);
  };

  const openEdit = (sub: SubLocation) => {
    setEditing(sub);
    setForm({
      locationId: sub.locationId,
      name: sub.name,
      type: sub.type,
      code: sub.code,
      status: sub.status,
    });
    setModalOpen(true);
  };

  const set = <K extends keyof SubLocationInput>(key: K, value: SubLocationInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.name.trim() || !form.locationId) return;
    setSaving(true);
    try {
      if (editing) await updateSubLocation(editing.id, form);
      else await createSubLocation(form);
      await refresh();
      setModalOpen(false);
      toast.success(editing ? "Sub-location updated" : "Sub-location created");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save sub-location");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (sub: SubLocation) => {
    try {
      const next: RecordStatus = sub.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateSubLocation(sub.id, { status: next });
      await refresh();
      toast.success(`Sub-location marked ${next === "ACTIVE" ? "active" : "inactive"}`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update status");
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteSubLocation(deleting.id);
      await refresh();
      toast.success("Sub-location deleted");
      setDeleting(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete sub-location");
    }
  };

  return (
    <div>
      <PageHeader
        title="Sub-locations"
        subtitle="Areas within a location such as blocks, floors, wings and zones"
        actions={
          canManage && (
            <button
              onClick={openCreate}
              className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-sm"
            >
              <Icon name="Plus" size={15} /> Add sub-location
            </button>
          )
        }
      />

      <div className="card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Icon name="MapPin" size={16} />
          <span>Filter by location</span>
        </div>
        <Select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="max-w-xs"
        >
          <option value="">— All locations —</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}{loc.isDefault ? " (default)" : ""}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <div className="card p-8 text-center">
          <p className="font-medium text-[var(--text)]">Sub-locations could not be loaded</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); setRetry((v) => v + 1); }}
            className="btn-primary mt-4 px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading sub-locations…</div>
      ) : subLocations.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subLocations.map((sub) => (
            <article key={sub.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]">
                    <Icon name="Building" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--text)]">{sub.name}</h2>
                    <p className="text-[0.72rem] text-[var(--text-subtle)]">{sub.locationName}</p>
                  </div>
                </div>
                {canManage && (
                  <Dropdown
                    trigger={({ toggle }) => (
                      <button
                        type="button"
                        onClick={toggle}
                        aria-label={`Actions for ${sub.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                      >
                        <Icon name="MoreVertical" size={16} />
                      </button>
                    )}
                  >
                    {(close) => (
                      <>
                        <DropdownItem icon="Pencil" onClick={() => { close(); openEdit(sub); }}>
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          icon={sub.status === "ACTIVE" ? "PauseCircle" : "PlayCircle"}
                          onClick={() => { close(); toggleStatus(sub); }}
                        >
                          {sub.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </DropdownItem>
                        <DropdownItem icon="Trash2" danger onClick={() => { close(); setDeleting(sub); }}>
                          Delete
                        </DropdownItem>
                      </>
                    )}
                  </Dropdown>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone="info">{SUB_LOCATION_TYPE_LABEL[sub.type]}</Badge>
                <Badge tone={sub.status === "ACTIVE" ? "success" : "muted"}>
                  {sub.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
                {sub.code && (
                  <span className="text-[0.7rem] uppercase tracking-wide text-[var(--text-subtle)]">{sub.code}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <Icon name="Building" size={30} className="mx-auto text-[var(--brand-300)]" />
          <p className="mt-3 font-medium text-[var(--text)]">No sub-locations</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {selectedLocation
              ? "Create a sub-location to organize this location further."
              : "Select a location to see its sub-locations."}
          </p>
          {canManage && selectedLocation && (
            <button onClick={openCreate} className="btn-primary mt-4 px-4 py-2 text-sm">
              Add sub-location
            </button>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit sub-location" : "Add sub-location"}
        description="Sub-locations group areas within a single location."
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-ghost px-3 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create sub-location"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Location" required>
            <Select value={form.locationId} onChange={(e) => set("locationId", e.target.value)}>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
            </Field>
            <Field label="Type">
              <Select value={form.type ?? "FLOOR"} onChange={(e) => set("type", e.target.value as SubLocationType)}>
                {SUB_LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>{SUB_LOCATION_TYPE_LABEL[t]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Code">
            <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value || null)} maxLength={16} />
          </Field>
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
        title="Delete sub-location?"
        description={`Delete ${deleting?.name ?? "this sub-location"}? This cannot be undone.`}
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
