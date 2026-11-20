import { Icon } from "@/components/ui/Icon";
import { StatCard } from "./StatCard";

export function EmployeeDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leaves Left" value="12" icon="CalendarDays" trend={{ value: "+2", up: true }} accent="brand" />
        <StatCard label="This Month" value="21d" icon="Clock" accent="success" />
        <StatCard label="Pending Requests" value="2" icon="Clock3" trend={{ value: "-1", up: true }} accent="warning" />
        <StatCard label="WFH Days" value="4" icon="Home" accent="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Leave balance */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text)]">Leave Balance</h3>
            <button className="text-xs font-semibold text-[var(--brand-600)]">View all</button>
          </div>
          <div className="space-y-3.5">
            {[
              { name: "Casual Leave", used: 4, total: 12, color: "var(--brand-500)" },
              { name: "Sick Leave", used: 1, total: 8, color: "var(--success)" },
              { name: "Earned Leave", used: 0, total: 6, color: "var(--warning)" },
              { name: "Comp-off", used: 1, total: 3, color: "var(--info)" },
            ].map((l) => (
              <div key={l.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)] font-medium">{l.name}</span>
                  <span className="text-[var(--text)] font-semibold">{l.total - l.used} / {l.total}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--slate-100)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(l.used / l.total) * 100}%`, background: l.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent requests */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text)]">Recent Requests</h3>
            <button className="text-xs font-semibold text-[var(--brand-600)]">View all</button>
          </div>
          <div className="space-y-3">
            {[
              { t: "Casual Leave", d: "Nov 22 – Nov 23", s: "Approved", badge: "badge-success" },
              { t: "Work From Home", d: "Nov 20", s: "Pending", badge: "badge-warning" },
              { t: "Permission (2h)", d: "Nov 18", s: "Approved", badge: "badge-success" },
              { t: "Sick Leave", d: "Nov 10", s: "Rejected", badge: "badge-danger" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">{r.t}</div>
                  <div className="text-xs text-[var(--text-muted)]">{r.d}</div>
                </div>
                <span className={`badge ${r.badge}`}>{r.s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming & quick actions */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--text)] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { l: "Apply Leave", i: "CalendarDays", c: "var(--brand-50)" },
                { l: "Log Hours", i: "Timer", c: "var(--success-bg)" },
                { l: "WFH Request", i: "Home", c: "var(--info-bg)" },
                { l: "Permission", i: "Clock", c: "var(--warning-bg)" },
              ].map((a) => (
                <button key={a.l} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brand-300)] hover:shadow-sm transition-all">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: a.c }}>
                    <Icon name={a.i} size={17} className="text-[var(--brand-700)]" />
                  </div>
                  <span className="text-xs font-medium text-[var(--text)]">{a.l}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-[var(--text)] mb-3">Upcoming</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[var(--brand-50)] flex items-center justify-center text-[var(--brand-700)] font-bold text-sm">22</div>
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">Approved Leave</div>
                  <div className="text-xs text-[var(--text-muted)]">Friday · Casual</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[var(--info-bg)] flex items-center justify-center text-[var(--info)] font-bold text-sm">25</div>
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">Team Meeting</div>
                  <div className="text-xs text-[var(--text-muted)]">Monday · 10:00 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
