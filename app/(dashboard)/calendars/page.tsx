"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { getCalendarEvents, type CalendarEvent, type CalendarEventType } from "@/lib/calendars";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Color theme per event type, matching the RightlyHR calendar palette. */
const TYPE_META: Record<CalendarEventType, { dot: string; chip: string; label: string }> = {
  BIRTHDAY: { dot: "#a5b4fc", chip: "bg-[#e0e7ff] text-[#3730a3]", label: "Birthdays" },
  ANNIVERSARY: { dot: "#fed7aa", chip: "bg-[#ffedd5] text-[#9a3412]", label: "Anniversaries" },
  NEW_JOINEE: { dot: "#fbcfe8", chip: "bg-[#fce7f3] text-[#9d174d]", label: "New Joinees" },
  HOLIDAY: { dot: "#bbf7d0", chip: "bg-[#dcfce7] text-[#166534]", label: "Holidays" },
};

const TYPE_ORDER: CalendarEventType[] = ["NEW_JOINEE", "BIRTHDAY", "ANNIVERSARY", "HOLIDAY"];

type ViewMode = "month" | "week" | "day" | "list";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarsPage() {
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [view, setView] = useState<ViewMode>("month");
  const [filters, setFilters] = useState<Record<CalendarEventType, boolean>>({
    BIRTHDAY: true,
    ANNIVERSARY: true,
    NEW_JOINEE: true,
    HOLIDAY: true,
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the visible date range for the current view.
  const { start, end, title } = useMemo(() => {
    if (view === "month") {
      const first = startOfMonth(cursor);
      const gridStart = startOfWeek(first);
      const gridEnd = addDays(gridStart, 41); // 6 weeks
      return {
        start: gridStart,
        end: gridEnd,
        title: `${MONTH_LABELS[cursor.getMonth()]} ${cursor.getFullYear()}`,
      };
    }
    if (view === "week") {
      const wkStart = startOfWeek(cursor);
      const wkEnd = addDays(wkStart, 6);
      return {
        start: wkStart,
        end: wkEnd,
        title: `${wkStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${wkEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    }
    if (view === "day") {
      return {
        start: cursor,
        end: cursor,
        title: cursor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      };
    }
    // list: pull a 3-month window
    const first = startOfMonth(cursor);
    const last = addDays(new Date(first.getFullYear(), first.getMonth() + 3, 0), 0);
    return { start: first, end: last, title: `Events` };
  }, [cursor, view]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getCalendarEvents({
        start: dateKey(start),
        end: dateKey(end),
      });
      setEvents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    void load();
  }, [load]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      if (!filters[ev.type]) continue;
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    // Sort each day's events by type order then title
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const ta = TYPE_ORDER.indexOf(a.type);
        const tb = TYPE_ORDER.indexOf(b.type);
        if (ta !== tb) return ta - tb;
        return a.title.localeCompare(b.title);
      });
    }
    return map;
  }, [events, filters]);

  const navigate = (dir: -1 | 1) => {
    if (view === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    } else if (view === "week") {
      setCursor(addDays(cursor, dir * 7));
    } else if (view === "day") {
      setCursor(addDays(cursor, dir));
    } else {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir * 3, 1));
    }
  };

  const goToday = () => setCursor(startOfMonth(new Date()));

  const toggleFilter = (type: CalendarEventType) =>
    setFilters((f) => ({ ...f, [type]: !f[type] }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        subtitle="Birthdays, anniversaries, new joinees and holidays"
      />

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ---------- Filter sidebar ---------- */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="card p-4 space-y-3">
            <div className="text-sm font-semibold text-[var(--text)]">Filters</div>
            {(Object.keys(TYPE_META) as CalendarEventType[]).map((type) => (
              <label
                key={type}
                className="flex items-center gap-3 cursor-pointer select-none group"
              >
                <input
                  type="checkbox"
                  checked={filters[type]}
                  onChange={() => toggleFilter(type)}
                  className="h-4 w-4 rounded border-[var(--border-strong)] text-[var(--brand-600)] focus:ring-[var(--brand-500)]"
                />
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: TYPE_META[type].dot }}
                />
                <span className="text-sm text-[var(--text)] group-hover:text-[var(--brand-700)]">
                  {TYPE_META[type].label}
                </span>
              </label>
            ))}
          </div>
        </aside>

        {/* ---------- Calendar panel ---------- */}
        <div className="flex-1 min-w-0">
          <div className="card overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 p-3 border-b border-[var(--border)] flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  className="btn-ghost h-9 w-9 p-0"
                  onClick={() => navigate(-1)}
                  title="Previous"
                >
                  <Icon name="ChevronLeft" size={18} />
                </button>
                <button
                  className="btn-ghost h-9 w-9 p-0"
                  onClick={() => navigate(1)}
                  title="Next"
                >
                  <Icon name="ChevronRight" size={18} />
                </button>
                <button className="btn-ghost h-9 px-3 text-sm font-medium" onClick={goToday}>
                  Today
                </button>
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
              <div className="flex bg-[var(--surface-2)] rounded-lg p-0.5">
                {(["month", "week", "day", "list"] as ViewMode[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`h-8 px-3 text-sm rounded-md capitalize transition-colors ${
                      view === v
                        ? "bg-[var(--bg)] text-[var(--text)] font-medium shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 text-sm text-[var(--danger)]">{error}</div>
            )}

            {view === "month" && (
              <MonthGrid
                start={start}
                eventsByDate={eventsByDate}
                loading={loading}
              />
            )}
            {view === "week" && (
              <WeekGrid start={start} eventsByDate={eventsByDate} loading={loading} />
            )}
            {view === "day" && (
              <DayView date={cursor} eventsByDate={eventsByDate} loading={loading} />
            )}
            {view === "list" && (
              <ListView events={events.filter((e) => filters[e.type])} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ Month grid ============================ */

function MonthGrid({
  start,
  eventsByDate,
  loading,
}: {
  start: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  loading: boolean;
}) {
  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 42; i++) arr.push(addDays(start, i));
    return arr;
  }, [start]);

  const today = new Date();
  const currentMonth = start.getMonth() === new Date().getMonth() ? start.getMonth() : null;

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((day, idx) => {
          const key = dateKey(day);
          const dayEvents = eventsByDate.get(key) ?? [];
          const inMonth = currentMonth === null || day.getMonth() === currentMonth;
          const isToday = isSameDay(day, today);
          return (
            <div
              key={idx}
              className={`min-h-[110px] border-b border-r border-[var(--border)] p-1.5 flex flex-col gap-1 ${
                idx % 7 === 6 ? "border-r-0" : ""
              } ${!inMonth ? "bg-[var(--surface-2)]/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-600)] text-white"
                      : inMonth
                      ? "text-[var(--text)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {loading ? (
                  <div className="h-5 rounded bg-[var(--surface-2)] animate-pulse" />
                ) : (
                  dayEvents.slice(0, 3).map((ev) => (
                    <EventChip key={ev.id} event={ev} />
                  ))
                )}
                {dayEvents.length > 3 && (
                  <span className="text-[0.65rem] text-[var(--text-muted)] px-1">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ Week grid ============================ */

function WeekGrid({
  start,
  eventsByDate,
  loading,
}: {
  start: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  loading: boolean;
}) {
  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) arr.push(addDays(start, i));
    return arr;
  }, [start]);

  return (
    <div className="grid grid-cols-7">
      {days.map((day, idx) => {
        const key = dateKey(day);
        const dayEvents = eventsByDate.get(key) ?? [];
        return (
          <div
            key={idx}
            className={`min-h-[300px] border-r border-[var(--border)] p-2 flex flex-col gap-2 ${
              idx === 6 ? "border-r-0" : ""
            }`}
          >
            <div className="text-center">
              <div className="text-xs text-[var(--text-muted)] uppercase">
                {WEEKDAYS[day.getDay()]}
              </div>
              <div className="text-lg font-semibold text-[var(--text)]">{day.getDate()}</div>
            </div>
            <div className="flex flex-col gap-1">
              {loading ? (
                <div className="h-5 rounded bg-[var(--surface-2)] animate-pulse" />
              ) : (
                dayEvents.map((ev) => <EventChip key={ev.id} event={ev} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================ Day view ============================ */

function DayView({
  date,
  eventsByDate,
  loading,
}: {
  date: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  loading: boolean;
}) {
  const dayEvents = eventsByDate.get(dateKey(date)) ?? [];
  return (
    <div className="p-4 space-y-2">
      {loading ? (
        <div className="h-8 rounded bg-[var(--surface-2)] animate-pulse" />
      ) : dayEvents.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] py-8 text-center">No events on this day.</div>
      ) : (
        dayEvents.map((ev) => <EventChip key={ev.id} event={ev} full />)
      )}
    </div>
  );
}

/* ============================ List view ============================ */

function ListView({
  events,
  loading,
}: {
  events: CalendarEvent[];
  loading: boolean;
}) {
  if (loading) {
    return <div className="p-4"><div className="h-8 rounded bg-[var(--surface-2)] animate-pulse" /></div>;
  }
  if (events.length === 0) {
    return <div className="p-8 text-center text-sm text-[var(--text-muted)]">No events.</div>;
  }
  return (
    <div className="divide-y divide-[var(--border)]">
      {events.map((ev) => (
        <div key={ev.id} className="flex items-center gap-3 p-3">
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: TYPE_META[ev.type].dot }}
          />
          <div className="text-xs text-[var(--text-muted)] w-24 flex-shrink-0">
            {new Date(ev.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--text)] truncate">{ev.title}</div>
            {ev.designation && (
              <div className="text-xs text-[var(--text-muted)] truncate">{ev.designation}</div>
            )}
          </div>
          <Badge tone="muted">{TYPE_META[ev.type].label}</Badge>
        </div>
      ))}
    </div>
  );
}

/* ============================ Event chip ============================ */

function EventChip({ event, full = false }: { event: CalendarEvent; full?: boolean }) {
  const meta = TYPE_META[event.type];
  return (
    <div
      className={`${meta.chip} rounded px-1.5 py-1 text-[0.7rem] leading-tight truncate ${
        full ? "text-sm" : ""
      }`}
      title={event.title}
    >
      {event.employeeCode && <span className="opacity-70">({event.employeeCode}) </span>}
      <span className="font-medium">{event.title}</span>
    </div>
  );
}
