"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import {
  LEAVE_TYPE_LABEL,
  LEAVE_TYPES,
  REQUEST_TYPE_ICON,
  REQUEST_TYPE_LABEL,
  createRequest,
  type LeaveType,
  type TimeOffRequest,
  type TimeOffRequestPayload,
  type TimeOffRequestType,
} from "@/lib/timeoff";

interface FormState {
  type: TimeOffRequestType;
  reason: string;

  // leave
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  days: string;

  // permission
  permissionDate: string;
  fromTime: string;
  toTime: string;

  // regularization
  regularizationDate: string;
  actualInTime: string;
  actualOutTime: string;

  // extra hours
  extraHoursDate: string;
  extraHoursFrom: string;
  extraHoursTo: string;
  extraHours: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY: FormState = {
  type: "LEAVE",
  reason: "",
  leaveType: "CASUAL",
  fromDate: today(),
  toDate: today(),
  days: "1",
  permissionDate: today(),
  fromTime: "",
  toTime: "",
  regularizationDate: today(),
  actualInTime: "",
  actualOutTime: "",
  extraHoursDate: today(),
  extraHoursFrom: "",
  extraHoursTo: "",
  extraHours: "",
};

/** Parse "HH:mm" to minutes since midnight (or null). */
function toMinutes(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Hours between two HH:mm strings (end - start), or null when inputs are invalid. */
function hoursBetween(from: string, to: string): number | null {
  const a = toMinutes(from);
  const b = toMinutes(to);
  if (a === null || b === null || b <= a) return null;
  return +((b - a) / 60).toFixed(2);
}

/**
 * The time-off request popup. The form fields swap based on the chosen request
 * type (leave / permission / regularization / extra hours). On success the
 * parent is handed the newly created request.
 */
export function TimeOffRequestDrawer({
  open,
  onClose,
  defaultType = "LEAVE",
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultType?: TimeOffRequestType;
  onCreated: (request: TimeOffRequest) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the drawer opens, pre-selecting the requested type.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    setForm({ ...EMPTY, type: defaultType });
  }, [open, defaultType]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Auto-compute extra hours from the time window (still editable by hand).
  useEffect(() => {
    if (form.type !== "EXTRA_HOURS") return;
    const computed = hoursBetween(form.extraHoursFrom, form.extraHoursTo);
    if (computed !== null) {
      setForm((current) =>
        current.extraHours === String(computed) ? current : { ...current, extraHours: String(computed) },
      );
    }
  }, [form.type, form.extraHoursFrom, form.extraHoursTo]);

  const computedHours = useMemo(
    () => hoursBetween(form.extraHoursFrom, form.extraHoursTo),
    [form.extraHoursFrom, form.extraHoursTo],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.reason.trim()) {
      setError("Please provide a reason for this request.");
      return;
    }

    const payload: TimeOffRequestPayload = {
      type: form.type,
      reason: form.reason.trim(),
    };

    if (form.type === "LEAVE") {
      if (!form.fromDate || !form.toDate) {
        setError("From and to dates are required.");
        return;
      }
      if (form.fromDate > form.toDate) {
        setError('The "From" date cannot be after the "To" date.');
        return;
      }
      const days = Number(form.days);
      if (!Number.isFinite(days) || days <= 0) {
        setError("The number of days must be greater than zero.");
        return;
      }
      payload.leaveType = form.leaveType;
      payload.fromDate = form.fromDate;
      payload.toDate = form.toDate;
      payload.days = days;
    } else if (form.type === "PERMISSION") {
      if (!form.permissionDate || !form.fromTime || !form.toTime) {
        setError("Date, from time and to time are all required.");
        return;
      }
      if (form.fromTime >= form.toTime) {
        setError("The end time must be after the start time.");
        return;
      }
      payload.permissionDate = form.permissionDate;
      payload.fromTime = form.fromTime;
      payload.toTime = form.toTime;
    } else if (form.type === "REGULARIZATION") {
      if (!form.regularizationDate || !form.actualInTime || !form.actualOutTime) {
        setError("Date, actual in time and actual out time are all required.");
        return;
      }
      if (form.actualInTime >= form.actualOutTime) {
        setError("The out time must be after the in time.");
        return;
      }
      payload.regularizationDate = form.regularizationDate;
      payload.actualInTime = form.actualInTime;
      payload.actualOutTime = form.actualOutTime;
    } else if (form.type === "EXTRA_HOURS") {
      if (!form.extraHoursDate || !form.extraHoursFrom || !form.extraHoursTo) {
        setError("Date, from time and to time are all required.");
        return;
      }
      if (form.extraHoursFrom >= form.extraHoursTo) {
        setError("The end time must be after the start time.");
        return;
      }
      const hours = Number(form.extraHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        setError("The extra hours value must be greater than zero.");
        return;
      }
      payload.extraHoursDate = form.extraHoursDate;
      payload.extraHoursFrom = form.extraHoursFrom;
      payload.extraHoursTo = form.extraHoursTo;
      payload.extraHours = hours;
    }

    setSaving(true);
    try {
      const result = await createRequest(payload);
      onCreated(result.request);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Apply for ${REQUEST_TYPE_LABEL[form.type].toLowerCase()}`}
      subtitle="Fill in the details below. The request is routed to the configured approver."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost h-9 px-4 text-[0.84rem]">
            Cancel
          </button>
          <button
            type="submit"
            form="timeoff-form"
            disabled={saving}
            className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-[0.84rem] disabled:opacity-60"
          >
            <Icon name={saving ? "RefreshCw" : "Send"} size={15} className={saving ? "animate-spin" : ""} />
            Submit request
          </button>
        </>
      }
    >
      <form id="timeoff-form" onSubmit={submit} className="contents">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-[0.82rem] text-[var(--danger)]">
            <Icon name="AlertCircle" size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="mb-6">
          <h4 className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">
            Request type
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["LEAVE", "PERMISSION", "REGULARIZATION", "EXTRA_HOURS"] as TimeOffRequestType[]).map((t) => {
              const active = form.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-[0.78rem] font-medium transition-colors ${
                    active
                      ? "border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand-300)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon name={REQUEST_TYPE_ICON[t]} size={17} />
                  {REQUEST_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
        </section>

        {form.type === "LEAVE" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Leave type" required htmlFor="to-leave-type">
                <Select
                  id="to-leave-type"
                  value={form.leaveType}
                  onChange={(e) => set("leaveType", e.target.value as LeaveType)}
                >
                  {LEAVE_TYPES.map((lt) => (
                    <option key={lt} value={lt}>
                      {LEAVE_TYPE_LABEL[lt]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Days" required htmlFor="to-days" hint="Half-day leaves can be entered as 0.5.">
                <Input
                  id="to-days"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={form.days}
                  onChange={(e) => set("days", e.target.value)}
                />
              </Field>
              <Field label="From date" required htmlFor="to-from">
                <Input id="to-from" type="date" value={form.fromDate} onChange={(e) => set("fromDate", e.target.value)} />
              </Field>
              <Field label="To date" required htmlFor="to-to">
                <Input id="to-to" type="date" value={form.toDate} onChange={(e) => set("toDate", e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        {form.type === "PERMISSION" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date" required htmlFor="to-perm-date">
                <Input
                  id="to-perm-date"
                  type="date"
                  value={form.permissionDate}
                  onChange={(e) => set("permissionDate", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="From time" required htmlFor="to-perm-from">
                  <Input
                    id="to-perm-from"
                    type="time"
                    value={form.fromTime}
                    onChange={(e) => set("fromTime", e.target.value)}
                  />
                </Field>
                <Field label="To time" required htmlFor="to-perm-to">
                  <Input
                    id="to-perm-to"
                    type="time"
                    value={form.toTime}
                    onChange={(e) => set("toTime", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>
        )}

        {form.type === "REGULARIZATION" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date" required htmlFor="to-reg-date">
                <Input
                  id="to-reg-date"
                  type="date"
                  value={form.regularizationDate}
                  onChange={(e) => set("regularizationDate", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Actual in time" required htmlFor="to-reg-in">
                  <Input
                    id="to-reg-in"
                    type="time"
                    value={form.actualInTime}
                    onChange={(e) => set("actualInTime", e.target.value)}
                  />
                </Field>
                <Field label="Actual out time" required htmlFor="to-reg-out">
                  <Input
                    id="to-reg-out"
                    type="time"
                    value={form.actualOutTime}
                    onChange={(e) => set("actualOutTime", e.target.value)}
                  />
                </Field>
              </div>
            </div>
            <p className="text-[0.75rem] text-[var(--text-subtle)]">
              Use this to correct a missing or incorrect punch for the selected day.
            </p>
          </section>
        )}

        {form.type === "EXTRA_HOURS" && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date" required htmlFor="to-eh-date">
                <Input
                  id="to-eh-date"
                  type="date"
                  value={form.extraHoursDate}
                  onChange={(e) => set("extraHoursDate", e.target.value)}
                />
              </Field>
              <Field label="Extra hours" required htmlFor="to-eh-hours" hint={computedHours !== null ? `Auto-computed: ${computedHours} h` : "Enter the time window below."}>
                <Input
                  id="to-eh-hours"
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={form.extraHours}
                  onChange={(e) => set("extraHours", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                <Field label="From time" required htmlFor="to-eh-from">
                  <Input
                    id="to-eh-from"
                    type="time"
                    value={form.extraHoursFrom}
                    onChange={(e) => set("extraHoursFrom", e.target.value)}
                  />
                </Field>
                <Field label="To time" required htmlFor="to-eh-to">
                  <Input
                    id="to-eh-to"
                    type="time"
                    value={form.extraHoursTo}
                    onChange={(e) => set("extraHoursTo", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6">
          <Field label="Reason" required htmlFor="to-reason">
            <Textarea
              id="to-reason"
              rows={4}
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Briefly explain why you are raising this request…"
            />
          </Field>
        </section>
      </form>
    </Drawer>
  );
}
