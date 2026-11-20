import { Icon } from "@/components/ui/Icon";
import { StatCard } from "./StatCard";

function PanelHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[0.9rem] font-semibold text-[var(--text)]">{title}</h3>
      {right}
    </div>
  );
}

export function EmployeeDashboard() {
  const leaveTotal = 29;
  const leaveLeft = 23;
  const pct = Math.round((leaveLeft / leaveTotal) * 100);
  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leaves Left" value="23" icon="CalendarDays" trend={{ value: "2", up: true }} accent="brand" spark={[18, 19, 20, 20, 21, 22, 23]} />
        <StatCard label="This Month" value="21d" icon="Clock" accent="success" spark={[18, 19, 20, 20, 21, 21, 21]} />
        <StatCard label="Pending Requests" value="2" icon="Clock3" trend={{ value: "1", up: true }} accent="warning" spark={[4, 3, 3, 3, 2, 2, 2]} />
        <StatCard label="WFH Days" value="4" icon="Home" accent="info" spark={[1, 2, 2, 3, 3, 4, 4]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Leave balance */}
        <div className="card p-5">
          <PanelHeader title="Leave Balance" right={<button className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]">View all</button>} />

          <div className="flex items-center gap-5 mb-5">
            <div className="relative h-[104px] w-[104px] flex-shrink-0">
              <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
                <circle cx="56" cy="56" r={R} fill="none" stroke="var(--slate-100)" strokeWidth="9" />
                <circle cx="56" cy="56" r={R} fill="none" stroke="var(--brand-600)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold text-[var(--text)]">{leaveLeft}</span>
                <span className="text-[0.6rem] text-[var(--text-subtle)] uppercase tracking-wide">of {leaveTotal}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[0.75rem] text-[var(--text-subtle)]">Available balance</div>
              <div className="text-[1.3rem] font-semibold text-[var(--text)] leading-tight">{leaveLeft} days</div>
              <div className="text-xs text-[var(--success)] font-medium mt-1 inline-flex items-center gap-1">
                <Icon name="TrendingUp" size={12} /> On track this quarter
              </div>
            </div>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-[var(--border)]">
            {[
              { name: "Casual Leave", used: 4, total: 12 },
              { name: "Sick Leave", used: 1, total: 8 },
              { name: "Earned Leave", used: 0, total: 6 },
              { name: "Comp-off", used: 1, total: 3 },
            ].map((l) => (
              <div key={l.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-muted)] font-medium">{l.name}</span>
                  <span className="text-[var(--text)] font-medium">{l.total - l.used} / {l.total}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--slate-100)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--brand-500)]" style={{ width: `${(l.used / l.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent requests */}
        <div className="card p-5">
          <PanelHeader title="Recent Requests" right={<button className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]">View all</button>} />
          <div className="space-y-1">
            {[
              { t: "Casual Leave", d: "Nov 22 – Nov 23", s: "Approved", badge: "badge-success" },
              { t: "Work From Home", d: "Nov 20", s: "Pending", badge: "badge-warning" },
              { t: "Permission (2h)", d: "Nov 18", s: "Approved", badge: "badge-success" },
              { t: "Sick Leave", d: "Nov 10", s: "Rejected", badge: "badge-danger" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                <div>
                  <div className="text-[0.83rem] font-medium text-[var(--text)]">{r.t}</div>
                  <div className="text-xs text-[var(--text-muted)]">{r.d}</div>
                </div>
                <span className={`badge ${r.badge}`}>{r.s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions & upcoming */}
        <div className="space-y-5">
          <div className="card p-5">
            <PanelHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { l: "Apply Leave", i: "CalendarDays" },
                { l: "Log Hours", i: "Timer" },
                { l: "WFH Request", i: "Home" },
                { l: "Permission", i: "Clock" },
              ].map((a) => (
                <button
                  key={a.l}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <span className="h-9 w-9 rounded-lg flex items-center justify-center bg-[var(--brand-50)] text-[var(--brand-600)]">
                    <Icon name={a.i} size={17} />
                  </span>
                  <span className="text-xs font-medium text-[var(--text)]">{a.l}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <PanelHeader title="Upcoming" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex flex-col items-center justify-center bg-[var(--brand-50)] text-[var(--brand-700)] leading-none">
                  <span className="text-[0.8rem] font-semibold">22</span>
                  <span className="text-[0.55rem] uppercase tracking-wide">Nov</span>
                </div>
                <div>
                  <div className="text-[0.83rem] font-medium text-[var(--text)]">Approved Leave</div>
                  <div className="text-xs text-[var(--text-muted)]">Friday · Casual</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex flex-col items-center justify-center bg-[var(--slate-100)] text-[var(--slate-600)] leading-none">
                  <span className="text-[0.8rem] font-semibold">25</span>
                  <span className="text-[0.55rem] uppercase tracking-wide">Nov</span>
                </div>
                <div>
                  <div className="text-[0.83rem] font-medium text-[var(--text)]">Team Meeting</div>
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
