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

export function AdminDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value="248" icon="Users" trend={{ value: "5.1%", up: true }} accent="brand" spark={[210, 218, 221, 230, 236, 241, 248]} />
        <StatCard label="Active Projects" value="12" icon="Briefcase" trend={{ value: "2", up: true }} accent="success" spark={[8, 9, 9, 10, 10, 11, 12]} />
        <StatCard label="Pending Requests" value="34" icon="Clock3" trend={{ value: "8", up: false }} accent="warning" spark={[20, 24, 22, 27, 26, 31, 34]} />
        <StatCard label="Monthly Cost" value="₹1.24Cr" icon="Wallet" trend={{ value: "3.2%", up: true }} accent="info" spark={[1.4, 1.36, 1.32, 1.3, 1.28, 1.26, 1.24]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance overview */}
        <div className="card p-5 lg:col-span-2">
          <PanelHeader
            title="Attendance Overview"
            right={
              <select className="input-base w-auto py-1.5 text-xs">
                <option>This Week</option>
                <option>This Month</option>
              </select>
            }
          />
          <div className="flex items-end gap-3 h-44">
            {[
              { d: "Mon", p: 92, a: 8 }, { d: "Tue", p: 95, a: 5 }, { d: "Wed", p: 88, a: 12 },
              { d: "Thu", p: 96, a: 4 }, { d: "Fri", p: 90, a: 10 }, { d: "Sat", p: 60, a: 40 },
            ].map((x, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1 items-end" style={{ height: "132px" }}>
                  <div
                    className="flex-1 rounded-t-[4px] transition-all duration-300"
                    style={{ height: `${x.p}%`, background: "var(--brand-600)" }}
                    title={`Present ${x.p}%`}
                  />
                  <div
                    className="flex-1 rounded-t-[4px] transition-all duration-300"
                    style={{ height: `${x.a}%`, background: "var(--slate-200)" }}
                    title={`Absent ${x.a}%`}
                  />
                </div>
                <span className="text-[0.7rem] text-[var(--text-subtle)] font-medium">{x.d}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-5 mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--brand-600)" }} /> Present
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--slate-200)" }} /> Absent
            </span>
          </div>
        </div>

        {/* System status */}
        <div className="card p-5">
          <PanelHeader title="System Status" right={<span className="badge badge-success">All good</span>} />
          <div className="space-y-1">
            {[
              { n: "API Server", s: "Operational", ok: true },
              { n: "Database", s: "Operational", ok: true },
              { n: "File Storage", s: "Operational", ok: true },
              { n: "Email Service", s: "Degraded", ok: false },
              { n: "Auth Service", s: "Operational", ok: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                <span className="flex items-center gap-2.5 text-[0.83rem] text-[var(--text)]">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`} />
                  {s.n}
                </span>
                <span className={`badge ${s.ok ? "badge-success" : "badge-warning"}`}>{s.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent activity */}
        <div className="card p-5">
          <PanelHeader title="Recent Activity" />
          <div className="relative space-y-4">
            {[
              { t: "New employee added", d: "Arjun Patel joined Engineering", time: "5 min ago", i: "User", tone: "success" },
              { t: "Payroll processed", d: "October payroll for 231 employees", time: "1 hour ago", i: "Wallet", tone: "brand" },
              { t: "Leave policy updated", d: "Casual leave policy revised", time: "3 hours ago", i: "CalendarDays", tone: "warning" },
              { t: "Backup completed", d: "Daily database backup successful", time: "6 hours ago", i: "Check", tone: "info" },
            ].map((a, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      a.tone === "success" ? "var(--success-bg)"
                      : a.tone === "warning" ? "var(--warning-bg)"
                      : a.tone === "info" ? "var(--info-bg)"
                      : "var(--brand-50)",
                    color:
                      a.tone === "success" ? "var(--success)"
                      : a.tone === "warning" ? "var(--warning)"
                      : a.tone === "info" ? "var(--info)"
                      : "var(--brand-600)",
                  }}
                >
                  <Icon name={a.i} size={15} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-[0.83rem] font-medium text-[var(--text)]">{a.t}</div>
                  <div className="text-xs text-[var(--text-muted)]">{a.d}</div>
                </div>
                <div className="text-[0.7rem] text-[var(--text-subtle)] flex-shrink-0 pt-1">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Department performance */}
        <div className="card p-5">
          <PanelHeader title="Department Performance" right={<button className="text-xs font-semibold text-[var(--brand-600)]">View all</button>} />
          <div className="space-y-4">
            {[
              { n: "Engineering", v: 94 },
              { n: "Sales", v: 88 },
              { n: "HR", v: 92 },
              { n: "Finance", v: 85 },
              { n: "Operations", v: 90 },
            ].map((d) => (
              <div key={d.n}>
                <div className="flex justify-between text-[0.83rem] mb-1.5">
                  <span className="text-[var(--text)] font-medium">{d.n}</span>
                  <span className="text-[var(--text-muted)]">{d.v}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--slate-100)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--brand-600)] transition-all duration-500" style={{ width: `${d.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
