"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { TablePagination, useClientPagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  availHoliday,
  cancelAvail,
  createHoliday,
  deleteHoliday,
  getHolidaySettings,
  getMyAvails,
  getTeamAvails,
  listHolidays,
  updateHoliday,
  updateHolidaySettings,
  type Holiday,
  type HolidayInput,
  type HolidayType,
  type MyAvails,
  type TeamAvails,
} from "@/lib/holidays";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EMPTY_FORM: HolidayInput = {
  name: "",
  date: "",
  type: "PUBLIC",
  description: "",
  locationId: null,
  status: "ACTIVE",
};

function formatDateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    weekday: WEEKDAYS[d.getDay()],
    month: MONTH_LABELS[d.getMonth()],
    monthIndex: d.getMonth(),
  };
}

export default function HolidaysPage() {
  const { can } = useAuth();
  const toast = useToast();
  const canManage = can("holidays", "MANAGE");

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [tab, setTab] = useState<"public" | "optional" | "team">("public");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [myAvails, setMyAvails] = useState<MyAvails | null>(null);
  const [team, setTeam] = useState<TeamAvails | null>(null);
  const [hasReports, setHasReports] = useState(false);
  const [settings, setSettings] = useState<{ optionalHolidayAllowance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<HolidayInput>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [busyAvail, setBusyAvail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, avails, teamData, s] = await Promise.all([
        listHolidays({ year }),
        getMyAvails(year).catch(() => null),
        getTeamAvails(year).catch(() => null),
        getHolidaySettings().catch(() => null),
      ]);
      setHolidays(list);
      setMyAvails(avails);
      setTeam(teamData);
      setHasReports(!!teamData && teamData.reports.length > 0);
      setSettings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  const availedIds = useMemo(
    () => new Set((myAvails?.avails ?? []).map((a) => a.holidayId)),
    [myAvails],
  );

  const filtered = useMemo(() => {
    const type: HolidayType = tab === "public" ? "PUBLIC" : "OPTIONAL";
    return holidays.filter((h) => h.type === type);
  }, [holidays, tab]);

  const grouped = useMemo(() => {
    const map = new Map<number, Holiday[]>();
    for (const h of filtered) {
      const m = formatDateParts(h.date).monthIndex;
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(h);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: `${year}-01-01` });
    setModalOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setForm({
      name: h.name,
      date: h.date.slice(0, 10),
      type: h.type,
      description: h.description ?? "",
      locationId: h.locationId,
      status: h.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.date) {
      toast.error("Name and date are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateHoliday(editing.id, form);
        toast.success("Holiday updated");
      } else {
        await createHoliday({ ...form, year });
        toast.success("Holiday created");
      }
      setModalOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save holiday");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteHoliday(deleting.id);
      toast.success("Holiday deleted");
      setDeleting(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete holiday");
    }
  };

  const handleAvail = async (h: Holiday) => {
    setBusyAvail(h.id);
    try {
      if (availedIds.has(h.id)) {
        await cancelAvail(h.id);
        toast.success("Optional holiday removed");
      } else {
        await availHoliday(h.id);
        toast.success("Optional holiday availed");
      }
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyAvail(null);
    }
  };

  const tabs = [
    { id: "public", label: "Public Holidays" },
    { id: "optional", label: "Optional Holidays" },
    ...(hasReports ? [{ id: "team", label: "Team" }] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Holidays"
        subtitle="Company holidays for the year"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-28"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            {canManage && (
              <button className="btn-primary inline-flex items-center gap-2 h-9 px-3" onClick={openCreate}>
                <Icon name="Plus" size={16} /> Add holiday
              </button>
            )}
          </div>
        }
      />

      {error && <div className="card p-4 text-sm text-[var(--danger)]">{error}</div>}

      {loading ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading holidays…</div>
      ) : (
        <>
          {tab === "optional" && myAvails && (
            <div className="card p-4 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold text-[var(--text)]">Optional holidays:</span>{" "}
                <span className="text-[var(--text-muted)]">
                  {myAvails.used} of {myAvails.optionalHolidayAllowance} availed
                  {canManage && settings ? ` (allowance: ${settings.optionalHolidayAllowance})` : ""}
                </span>
              </div>
              {canManage && (
                <button
                  className="btn-ghost text-xs h-8 px-3"
                  onClick={async () => {
                    const next = window.prompt("Optional holiday allowance per year", String(settings?.optionalHolidayAllowance ?? 2));
                    if (next === null) return;
                    const n = Number(next);
                    if (Number.isNaN(n) || n < 0) return toast.error("Enter a valid number");
                    try {
                      await updateHolidaySettings({ optionalHolidayAllowance: n });
                      toast.success("Allowance updated");
                      void load();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                >
                  Edit allowance
                </button>
              )}
            </div>
          )}

          <Tabs tabs={tabs} initial={tab} onChange={(id) => setTab(id as typeof tab)} />

          <div className="mt-5">
            {tab === "team" ? (
              <TeamView team={team} />
            ) : grouped.length === 0 ? (
              <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
                No {tab === "public" ? "public" : "optional"} holidays for {year}.
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([monthIdx, items]) => (
                  <section key={monthIdx}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-[0.78rem] font-bold uppercase tracking-[0.12em] text-[var(--brand-700)]">
                        {MONTH_LABELS[monthIdx]} {year}
                      </h3>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                      <span className="text-[0.72rem] text-[var(--text-muted)]">{items.length} day{items.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="card divide-y divide-[var(--border)] overflow-hidden">
                      {items.map((h) => {
                        const parts = formatDateParts(h.date);
                        const isOptional = h.type === "OPTIONAL";
                        const availed = availedIds.has(h.id);
                        return (
                          <div key={h.id} className="flex items-center gap-4 p-4 hover:bg-[var(--surface-2)]/40 transition-colors">
                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)] flex-shrink-0">
                              <span className="text-lg font-bold leading-none">{parts.day}</span>
                              <span className="text-[0.6rem] uppercase tracking-wide mt-0.5">{parts.weekday.slice(0, 3)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[var(--text)]">{h.name}</span>
                                <Badge tone={isOptional ? "warning" : "brand"}>{isOptional ? "Optional" : "Public"}</Badge>
                                {h.status === "INACTIVE" && <Badge tone="muted">Inactive</Badge>}
                              </div>
                              {h.description && (
                                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">{h.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isOptional && !canManage && (
                                <button
                                  className={availed ? "btn-ghost text-xs h-8 px-3" : "btn-primary text-xs h-8 px-3"}
                                  disabled={busyAvail === h.id || (!availed && (myAvails?.remaining ?? 0) <= 0)}
                                  onClick={() => handleAvail(h)}
                                >
                                  {busyAvail === h.id ? "…" : availed ? "Availed" : "Avail"}
                                </button>
                              )}
                              {canManage && (
                                <>
                                  <button className="btn-ghost h-8 w-8 p-0" onClick={() => openEdit(h)} title="Edit">
                                    <Icon name="Pencil" size={15} />
                                  </button>
                                  <button className="btn-ghost h-8 w-8 p-0 text-[var(--danger)]" onClick={() => setDeleting(h)} title="Delete">
                                    <Icon name="Trash2" size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit holiday" : "Add holiday"}
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
          <Field label="Name" required htmlFor="h-name">
            <Input id="h-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Republic Day" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required htmlFor="h-date">
              <Input id="h-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Type" htmlFor="h-type">
              <Select id="h-type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as HolidayType }))}>
                <option value="PUBLIC">Public</option>
                <option value="OPTIONAL">Optional</option>
              </Select>
            </Field>
          </div>
          <Field label="Description" htmlFor="h-desc">
            <Textarea id="h-desc" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional notes" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete holiday"
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
          Delete <span className="font-semibold text-[var(--text)]">{deleting?.name}</span>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function TeamView({ team }: { team: TeamAvails | null }) {
  const avails = team?.avails ?? [];
  const pag = useClientPagination(avails, 10);
  if (!team || team.reports.length === 0) {
    return <div className="card p-10 text-center text-sm text-[var(--text-muted)]">No direct reports.</div>;
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Employee</th>
            <th className="text-left px-4 py-3 font-medium">Holiday</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Availed on</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {avails.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">No optional holidays availed by your team.</td></tr>
          ) : pag.pageItems.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium">{a.employee.name}</td>
              <td className="px-4 py-3">{a.holiday.name}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(a.holiday.date).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePagination
        page={pag.page}
        pageSize={pag.pageSize}
        total={pag.total}
        totalPages={pag.totalPages}
        onPageChange={pag.setPage}
        onPageSizeChange={pag.setPageSize}
        label="avails"
      />
    </div>
  );
}
