"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  createEvent,
  deleteEvent,
  getMyRsvps,
  listEvents,
  rsvpToEvent,
  updateEvent,
  type Event,
  type EventInput,
  type RSVPResponse,
} from "@/lib/events";

const EMPTY_FORM: EventInput = {
  title: "",
  description: "",
  date: "",
  endDate: null,
  location: "",
  category: "",
  status: "ACTIVE",
};

const RSVP_OPTIONS: { value: RSVPResponse; label: string; tone: "success" | "warning" | "muted" }[] = [
  { value: "GOING", label: "Going", tone: "success" },
  { value: "INTERESTED", label: "Interested", tone: "warning" },
  { value: "NOT_GOING", label: "Not Going", tone: "muted" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EventsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const canManage = can("events", "MANAGE");

  const [tab, setTab] = useState<"upcoming" | "all" | "mine">("upcoming");
  const [events, setEvents] = useState<Event[]>([]);
  const [myRsvpIds, setMyRsvpIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState<EventInput>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const [busyRsvp, setBusyRsvp] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, mine] = await Promise.all([
        listEvents(),
        getMyRsvps().catch(() => []),
      ]);
      setEvents(list);
      setMyRsvpIds(new Set(mine.map((r) => r.eventId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const filtered = useMemo(() => {
    if (tab === "upcoming") {
      return events.filter((e) => new Date(e.date).getTime() >= now);
    }
    if (tab === "mine") {
      return events.filter((e) => myRsvpIds.has(e.id));
    }
    return events;
  }, [events, tab, myRsvpIds, now]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (e: Event) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description ?? "",
      date: e.date.slice(0, 16),
      endDate: e.endDate ? e.endDate.slice(0, 16) : null,
      location: e.location ?? "",
      category: e.category ?? "",
      status: e.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim() || !form.date) {
      toast.error("Title and date are required");
      return;
    }
    setSaving(true);
    try {
      const payload: EventInput = {
        ...form,
        date: new Date(form.date).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      if (editing) {
        await updateEvent(editing.id, payload);
        toast.success("Event updated");
      } else {
        await createEvent(payload);
        toast.success("Event created");
      }
      setModalOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteEvent(deleting.id);
      toast.success("Event deleted");
      setDeleting(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete event");
    }
  };

  const handleRsvp = async (eventId: string, response: RSVPResponse) => {
    setBusyRsvp(eventId);
    try {
      await rsvpToEvent(eventId, response);
      toast.success(`RSVP updated: ${response.toLowerCase().replace("_", " ")}`);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update RSVP");
    } finally {
      setBusyRsvp(null);
    }
  };

  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "all", label: "All Events" },
    { id: "mine", label: "My RSVPs" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Events"
        subtitle="Company events and RSVPs"
        actions={
          canManage && (
            <button className="btn-primary inline-flex items-center gap-2 h-9 px-3" onClick={openCreate}>
              <Icon name="Plus" size={16} /> Create event
            </button>
          )
        }
      />

      {error && <div className="card p-4 text-sm text-[var(--danger)]">{error}</div>}

      {loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading events…</div>
      ) : (
        <>
          <Tabs tabs={tabs} initial={tab} onChange={(id) => setTab(id as typeof tab)} />

          <div className="mt-5">
            {filtered.length === 0 ? (
              <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
                No events found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    canManage={canManage}
                    busyRsvp={busyRsvp === e.id}
                    onRsvp={(r) => handleRsvp(e.id, r)}
                    onEdit={() => openEdit(e)}
                    onDelete={() => setDeleting(e)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit event" : "Create event"}
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
          <Field label="Title" required htmlFor="e-title">
            <Input id="e-title" value={form.title} onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))} placeholder="e.g. Team Outing" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date & Time" required htmlFor="e-date">
              <Input id="e-date" type="datetime-local" value={form.date} onChange={(ev) => setForm((f) => ({ ...f, date: ev.target.value }))} />
            </Field>
            <Field label="End Date & Time" htmlFor="e-end">
              <Input id="e-end" type="datetime-local" value={form.endDate ?? ""} onChange={(ev) => setForm((f) => ({ ...f, endDate: ev.target.value || null }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" htmlFor="e-loc">
              <Input id="e-loc" value={form.location ?? ""} onChange={(ev) => setForm((f) => ({ ...f, location: ev.target.value }))} placeholder="e.g. Office" />
            </Field>
            <Field label="Category" htmlFor="e-cat">
              <Input id="e-cat" value={form.category ?? ""} onChange={(ev) => setForm((f) => ({ ...f, category: ev.target.value }))} placeholder="e.g. Social" />
            </Field>
          </div>
          <Field label="Description" htmlFor="e-desc">
            <Textarea id="e-desc" value={form.description ?? ""} onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))} rows={3} placeholder="Optional details" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete event"
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
          Delete event <span className="font-semibold text-[var(--text)]">{deleting?.title}</span>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

/* ============================ Event card ============================ */

function EventCard({
  event,
  canManage,
  busyRsvp,
  onRsvp,
  onEdit,
  onDelete,
}: {
  event: Event;
  canManage: boolean;
  busyRsvp: boolean;
  onRsvp: (r: RSVPResponse) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dateObj = new Date(event.date);
  const isPast = dateObj.getTime() < Date.now();

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[var(--text)] truncate">{event.title}</h3>
            {event.category && <Badge tone="brand">{event.category}</Badge>}
          </div>
          {event.description && (
            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="btn-ghost h-7 w-7 p-0" onClick={onEdit} title="Edit">
              <Icon name="Pencil" size={14} />
            </button>
            <button className="btn-ghost h-7 w-7 p-0 text-[var(--danger)]" onClick={onDelete} title="Delete">
              <Icon name="Trash2" size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <Icon name="Calendar" size={13} />
          <span>{formatDateTime(event.date)}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <Icon name="MapPin" size={13} />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Attendee summary */}
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 text-[var(--success)]">
          <Icon name="Check" size={12} /> {event.rsvpSummary.going} going
        </span>
        <span className="inline-flex items-center gap-1 text-[var(--warning)]">
          <Icon name="Star" size={12} /> {event.rsvpSummary.interested} interested
        </span>
      </div>

      {/* RSVP buttons */}
      {!isPast && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {RSVP_OPTIONS.map((opt) => {
            const active = event.myRsvp === opt.value;
            return (
              <button
                key={opt.value}
                disabled={busyRsvp}
                onClick={() => onRsvp(opt.value)}
                className={`h-8 px-3 text-xs rounded-md border transition-colors ${
                  active
                    ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)] font-medium"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                } ${busyRsvp ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      {isPast && event.myRsvp && (
        <Badge tone="muted">You responded: {event.myRsvp.replace("_", " ")}</Badge>
      )}
    </div>
  );
}
