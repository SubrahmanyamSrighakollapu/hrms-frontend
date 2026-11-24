"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  bookDesk,
  cancelBooking,
  createDesk,
  deleteDesk,
  getMyBookings,
  listDesks,
  updateDesk,
  type Desk,
  type DeskInput,
  type MyDeskBooking,
} from "@/lib/desk-management";

const EMPTY_FORM: DeskInput = {
  name: "",
  code: "",
  locationId: null,
  status: "ACTIVE",
};

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DeskManagementPage() {
  const { can } = useAuth();
  const toast = useToast();
  const canManage = can("desk-management", "MANAGE");

  const [tab, setTab] = useState<"desks" | "mine">("desks");
  const [date, setDate] = useState<string>(todayISO());
  const [desks, setDesks] = useState<Desk[]>([]);
  const [myBookings, setMyBookings] = useState<MyDeskBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Desk | null>(null);
  const [form, setForm] = useState<DeskInput>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Desk | null>(null);
  const [bookingDesk, setBookingDesk] = useState<Desk | null>(null);
  const [busyBooking, setBusyBooking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, mine] = await Promise.all([
        listDesks({ date }),
        getMyBookings().catch(() => []),
      ]);
      setDesks(list);
      setMyBookings(mine);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load desks");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableCount = useMemo(
    () => desks.filter((d) => d.status === "ACTIVE" && !d.bookedBy).length,
    [desks],
  );
  const bookedCount = desks.length - availableCount;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (d: Desk) => {
    setEditing(d);
    setForm({
      name: d.name,
      code: d.code,
      locationId: d.locationId,
      status: d.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.code?.trim()) {
      toast.error("Name and code are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDesk(editing.id, form);
        toast.success("Desk updated");
      } else {
        await createDesk(form);
        toast.success("Desk created");
      }
      setModalOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save desk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDesk(deleting.id);
      toast.success("Desk deleted");
      setDeleting(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete desk");
    }
  };

  const handleBook = async (desk: Desk) => {
    setBusyBooking(desk.id);
    try {
      await bookDesk(desk.id, { date });
      toast.success(`Desk ${desk.code} booked for ${formatDate(date)}`);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to book desk");
    } finally {
      setBusyBooking(null);
      setBookingDesk(null);
    }
  };

  const handleCancel = async (booking: MyDeskBooking) => {
    try {
      await cancelBooking(booking.id);
      toast.success("Booking cancelled");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel booking");
    }
  };

  const tabs = [
    { id: "desks", label: "Desks" },
    { id: "mine", label: "My Bookings" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Desk Management"
        subtitle="Book a desk for the day"
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
            {canManage && (
              <button className="btn-primary inline-flex items-center gap-2 h-9 px-3" onClick={openCreate}>
                <Icon name="Plus" size={16} /> Add desk
              </button>
            )}
          </div>
        }
      />

      {error && <div className="card p-4 text-sm text-[var(--danger)]">{error}</div>}

      {loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>
      ) : (
        <>
          <Tabs tabs={tabs} initial={tab} onChange={(id) => setTab(id as typeof tab)} />

          {tab === "desks" ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                <span><span className="font-semibold text-[var(--text)]">{availableCount}</span> available</span>
                <span><span className="font-semibold text-[var(--text)]">{bookedCount}</span> booked</span>
                <span className="text-xs">{formatDate(date)}</span>
              </div>

              {desks.length === 0 ? (
                <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
                  No desks found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {desks.map((d) => {
                    const booked = !!d.bookedBy;
                    const isMine = booked;
                    return (
                      <div
                        key={d.id}
                        className={`card p-4 flex flex-col gap-2 ${
                          d.status === "INACTIVE" ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-[var(--text)]">{d.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">{d.code}</div>
                          </div>
                          {booked ? (
                            <Badge tone="warning">Booked</Badge>
                          ) : (
                            <Badge tone="success">Available</Badge>
                          )}
                        </div>
                        {d.locationName && (
                          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Icon name="MapPin" size={12} /> {d.locationName}
                          </div>
                        )}
                        {booked && (
                          <div className="text-xs text-[var(--text-muted)]">
                            by <span className="font-medium text-[var(--text)]">{d.bookedBy!.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          {!booked && d.status === "ACTIVE" && (
                            <button
                              className="btn-primary text-xs h-8 px-3 flex-1"
                              disabled={busyBooking === d.id}
                              onClick={() => handleBook(d)}
                            >
                              {busyBooking === d.id ? "Booking…" : "Book"}
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button className="btn-ghost h-8 w-8 p-0" onClick={() => openEdit(d)} title="Edit">
                                <Icon name="Pencil" size={14} />
                              </button>
                              <button
                                className="btn-ghost h-8 w-8 p-0 text-[var(--danger)]"
                                onClick={() => setDeleting(d)}
                                title="Delete"
                              >
                                <Icon name="Trash2" size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5">
              {myBookings.length === 0 ? (
                <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
                  You have no desk bookings.
                </div>
              ) : (
                <div className="card divide-y divide-[var(--border)] overflow-hidden">
                  {myBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-medium text-[var(--text)]">
                          {b.deskName} <span className="text-[var(--text-muted)] font-normal">({b.deskCode})</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">{formatDate(b.date)}</div>
                      </div>
                      <button
                        className="btn-ghost text-xs h-8 px-3 text-[var(--danger)]"
                        onClick={() => handleCancel(b)}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit desk" : "Add desk"}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost h-9 px-4" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary h-9 px-4" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required htmlFor="d-name">
            <Input id="d-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Desk A1" />
          </Field>
          <Field label="Code" required htmlFor="d-code">
            <Input id="d-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. A1" />
          </Field>
          <Field label="Status" htmlFor="d-status">
            <Select id="d-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DeskInput["status"] }))}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete desk"
        icon="Trash2"
        tone="danger"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost h-9 px-4" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn-danger h-9 px-4" onClick={handleDelete}>Delete</button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          Delete desk <span className="font-semibold text-[var(--text)]">{deleting?.name}</span>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
