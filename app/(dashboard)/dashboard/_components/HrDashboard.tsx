import { Icon } from "@/components/ui/Icon";
import { StatCard } from "./StatCard";

export function HrDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value="248" icon="Users" trend={{ value: "+12", up: true }} accent="brand" />
        <StatCard label="Pending Approvals" value="18" icon="Clock3" trend={{ value: "+5", up: false }} accent="warning" />
        <StatCard label="On Leave Today" value="7" icon="CalendarDays" accent="info" />
        <StatCard label="New Joinees" value="4" icon="User" trend={{ value: "+2", up: true }} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending approvals */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text)]">Pending Approvals</h3>
            <button className="text-xs font-semibold text-[var(--brand-600)]">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="pb-2 font-medium">Employee</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { n: "Rahul Verma", t: "Casual Leave", d: "2 days", s: "Pending", b: "badge-warning" },
                  { n: "Anita Rao", t: "Work From Home", d: "1 day", s: "Pending", b: "badge-warning" },
                  { n: "Karan Mehta", t: "Permission", d: "3 hours", s: "Pending", b: "badge-warning" },
                  { n: "Sneha Iyer", t: "Comp-off", d: "1 day", s: "Pending", b: "badge-warning" },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-xs font-bold flex items-center justify-center">{r.n.split(" ").map((w) => w[0]).join("")}</div>
                        <span className="font-medium text-[var(--text)]">{r.n}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-[var(--text-muted)]">{r.t}</td>
                    <td className="py-2.5 text-[var(--text-muted)]">{r.d}</td>
                    <td className="py-2.5"><span className={`badge ${r.b}`}>{r.s}</span></td>
                    <td className="py-2.5 text-right">
                      <button className="h-7 px-2.5 rounded-md bg-[var(--success-bg)] text-[var(--success)] text-xs font-semibold hover:bg-[var(--success)] hover:text-white mr-1">Approve</button>
                      <button className="h-7 px-2.5 rounded-md bg-[var(--danger-bg)] text-[var(--danger)] text-xs font-semibold hover:bg-[var(--danger)] hover:text-white">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Headcount by department */}
        <div className="card p-5">
          <h3 className="font-semibold text-[var(--text)] mb-4">Headcount by Dept</h3>
          <div className="space-y-3">
            {[
              { n: "Engineering", v: 86, c: "var(--brand-500)" },
              { n: "Sales", v: 54, c: "var(--success)" },
              { n: "HR", v: 18, c: "var(--warning)" },
              { n: "Finance", v: 24, c: "var(--info)" },
              { n: "Operations", v: 66, c: "#8b5cf6" },
            ].map((d) => (
              <div key={d.n}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text)] font-medium">{d.n}</span>
                  <span className="text-[var(--text-muted)]">{d.v}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--slate-100)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.v / 86) * 100}%`, background: d.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent joins */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text)]">Recent Joinees</h3>
            <button className="text-xs font-semibold text-[var(--brand-600)]">View all</button>
          </div>
          <div className="space-y-3">
            {[
              { n: "Arjun Patel", d: "Software Engineer", j: "Joined Nov 15", c: "var(--brand-50)" },
              { n: "Meera Joshi", d: "HR Executive", j: "Joined Nov 12", c: "var(--success-bg)" },
              { n: "Vikram Singh", d: "Finance Analyst", j: "Joined Nov 10", c: "var(--warning-bg)" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: e.c, color: "var(--brand-700)" }}>{e.n.split(" ").map((w) => w[0]).join("")}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text)] truncate">{e.n}</div>
                  <div className="text-xs text-[var(--text-muted)]">{e.d}</div>
                </div>
                <span className="badge badge-success">{e.j}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text)]">Payroll — October</h3>
            <span className="badge badge-info">Processing</span>
          </div>
          <div className="flex items-end gap-2 h-32 mt-2">
            {[40, 65, 50, 80, 55, 90, 70, 85, 60, 75, 95, 88].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === 11 ? "var(--brand-700)" : "var(--brand-200)" }} />
            ))}
          </div>
          <div className="flex justify-between text-[0.7rem] text-[var(--text-subtle)] mt-2">
            {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m) => <span key={m}>{m}</span>)}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between text-sm">
            <div><div className="text-xs text-[var(--text-muted)]">Processed</div><div className="font-bold text-[var(--text)]">231 / 248</div></div>
            <div><div className="text-xs text-[var(--text-muted)]">Total Payout</div><div className="font-bold text-[var(--text)]">₹1.24 Cr</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
