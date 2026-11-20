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

export function HrDashboard() {
  const pct = Math.round((231 / 248) * 100);
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value="248" icon="Users" trend={{ value: "12", up: true }} accent="brand" spark={[224, 228, 233, 238, 242, 245, 248]} />
        <StatCard label="Pending Approvals" value="18" icon="Clock3" trend={{ value: "5", up: false }} accent="warning" spark={[9, 11, 10, 13, 15, 16, 18]} />
        <StatCard label="On Leave Today" value="7" icon="CalendarDays" accent="info" spark={[4, 6, 5, 8, 6, 9, 7]} />
        <StatCard label="New Joinees" value="4" icon="User" trend={{ value: "2", up: true }} accent="success" spark={[1, 1, 2, 2, 3, 3, 4]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending approvals */}
        <div className="card p-5 lg:col-span-2">
          <PanelHeader title="Pending Approvals" right={<button className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]">View all</button>} />
          <div className="overflow-x-auto">
            <table className="w-full text-[0.83rem]">
              <thead>
                <tr className="text-left text-xs text-[var(--text-subtle)] border-b border-[var(--border)]">
                  <th className="pb-2.5 font-medium">Employee</th>
                  <th className="pb-2.5 font-medium">Type</th>
                  <th className="pb-2.5 font-medium">Duration</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { n: "Rahul Verma", t: "Casual Leave", d: "2 days" },
                  { n: "Anita Rao", t: "Work From Home", d: "1 day" },
                  { n: "Karan Mehta", t: "Permission", d: "3 hours" },
                  { n: "Sneha Iyer", t: "Comp-off", d: "1 day" },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-[0.65rem] font-bold flex items-center justify-center">
                          {r.n.split(" ").map((w) => w[0]).join("")}
                        </div>
                        <span className="font-medium text-[var(--text)]">{r.n}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-[var(--text-muted)]">{r.t}</td>
                    <td className="py-2.5 text-[var(--text-muted)]">{r.d}</td>
                    <td className="py-2.5"><span className="badge badge-warning">Pending</span></td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button className="h-7 px-2.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold hover:bg-[var(--surface-2)] mr-1.5 transition-colors">Approve</button>
                      <button className="h-7 px-2.5 rounded-md text-[var(--text-subtle)] text-xs font-semibold hover:bg-[var(--surface-2)] transition-colors">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Headcount by department */}
        <div className="card p-5">
          <PanelHeader title="Headcount by Dept" />
          <div className="space-y-4">
            {[
              { n: "Engineering", v: 86 },
              { n: "Sales", v: 54 },
              { n: "HR", v: 18 },
              { n: "Finance", v: 24 },
              { n: "Operations", v: 66 },
            ].map((d) => (
              <div key={d.n}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text)] font-medium">{d.n}</span>
                  <span className="text-[var(--text-muted)]">{d.v}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--slate-100)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--brand-600)] transition-all duration-500" style={{ width: `${(d.v / 86) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent joins */}
        <div className="card p-5">
          <PanelHeader title="Recent Joinees" right={<button className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]">View all</button>} />
          <div className="space-y-1">
            {[
              { n: "Arjun Patel", d: "Software Engineer", j: "Nov 15" },
              { n: "Meera Joshi", d: "HR Executive", j: "Nov 12" },
              { n: "Vikram Singh", d: "Finance Analyst", j: "Nov 10" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                <div className="h-8 w-8 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-[0.65rem] font-bold flex items-center justify-center">
                  {e.n.split(" ").map((w) => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.83rem] font-medium text-[var(--text)] truncate">{e.n}</div>
                  <div className="text-xs text-[var(--text-muted)]">{e.d}</div>
                </div>
                <span className="badge badge-muted">Joined {e.j}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll status */}
        <div className="card p-5">
          <PanelHeader title="Payroll — October" right={<span className="badge badge-info">Processing</span>} />
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative h-[116px] w-[116px] flex-shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--slate-100)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r={R} fill="none" stroke="var(--brand-600)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (C * pct) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold text-[var(--text)]">{pct}%</span>
                <span className="text-[0.6rem] text-[var(--text-subtle)] uppercase tracking-wide">Processed</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-end gap-1 h-16 mb-4">
                {[40, 65, 50, 80, 55, 90, 70, 85, 60, 75, 95, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[3px]"
                    style={{ height: `${h}%`, background: i === 11 ? "var(--brand-600)" : "var(--brand-100)" }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-[var(--border)]">
                <div>
                  <div className="text-[0.7rem] text-[var(--text-subtle)]">Processed</div>
                  <div className="font-semibold text-[var(--text)]">231 / 248</div>
                </div>
                <div className="text-right">
                  <div className="text-[0.7rem] text-[var(--text-subtle)]">Total Payout</div>
                  <div className="font-semibold text-[var(--text)]">₹1.24 Cr</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
