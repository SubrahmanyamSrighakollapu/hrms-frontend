import { Icon } from "@/components/ui/Icon";
import { StatCard } from "./StatCard";

export function AdminDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value="248" icon="Users" trend={{ value: "+5.1%", up: true }} accent="brand" />
        <StatCard label="Active Projects" value="12" icon="Briefcase" trend={{ value: "+2", up: true }} accent="success" />
        <StatCard label="Pending Requests" value="34" icon="Clock3" trend={{ value: "+8", up: false }} accent="warning" />
        <StatCard label="Monthly Cost" value="₹1.24Cr" icon="Wallet" trend={{ value: "-3.2%", up: true }} accent="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance overview */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text)]">Attendance Overview</h3>
            <select className="input-base w-auto py-1.5 text-xs">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="flex items-end gap-1.5 h-40">
            {[
              { d: "Mon", p: 92, a: 8 }, { d: "Tue", p: 95, a: 5 }, { d: "Wed", p: 88, a: 12 },
              { d: "Thu", p: 96, a: 4 }, { d: "Fri", p: 90, a: 10 }, { d: "Sat", p: 60, a: 40 },
            ].map((x, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                  <div className="flex-1 rounded-t" style={{ height: `${x.p}%`, background: "var(--brand-500)" }} />
                  <div className="flex-1 rounded-t" style={{ height: `${x.a}%`, background: "var(--brand-200)" }} />
                </div>
                <span className="text-[0.7rem] text-[var(--text-muted)]">{x.d}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-500)]" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-200)]" /> Absent</span>
          </div>
        </div>

        {/* System status */}
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--text)] mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { n: "API Server", s: "Operational", b: "badge-success" },
              { n: "Database", s: "Operational", b: "badge-success" },
              { n: "File Storage", s: "Operational", b: "badge-success" },
              { n: "Email Service", s: "Degraded", b: "badge-warning" },
              { n: "Auth Service", s: "Operational", b: "badge-success" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--text)]">{s.n}</span>
                <span className={`badge ${s.b}`}>{s.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent activity */}
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--text)] mb-4">Recent Activity</h3>
          <div className="space-y-3.5">
            {[
              { t: "New employee added", d: "Arjun Patel joined Engineering", time: "5 min ago", i: "User", c: "var(--success-bg)" },
              { t: "Payroll processed", d: "October payroll for 231 employees", time: "1 hour ago", i: "Wallet", c: "var(--brand-50)" },
              { t: "Leave policy updated", d: "Casual leave policy revised", time: "3 hours ago", i: "CalendarDays", c: "var(--warning-bg)" },
              { t: "Backup completed", d: "Daily database backup successful", time: "6 hours ago", i: "Check", c: "var(--info-bg)" },
            ].map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.c }}>
                  <Icon name={a.i} size={15} className="text-[var(--brand-700)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text)]">{a.t}</div>
                  <div className="text-xs text-[var(--text-muted)]">{a.d}</div>
                </div>
                <div className="text-[0.7rem] text-[var(--text-subtle)] flex-shrink-0">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top departments */}
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--text)] mb-4">Department Performance</h3>
          <div className="space-y-3.5">
            {[
              { n: "Engineering", v: 94, c: "var(--brand-500)" },
              { n: "Sales", v: 88, c: "var(--success)" },
              { n: "HR", v: 92, c: "var(--warning)" },
              { n: "Finance", v: 85, c: "var(--info)" },
              { n: "Operations", v: 90, c: "#8b5cf6" },
            ].map((d) => (
              <div key={d.n}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text)] font-medium">{d.n}</span>
                  <span className="text-[var(--text-muted)] font-semibold">{d.v}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--slate-100)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.v}%`, background: d.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
