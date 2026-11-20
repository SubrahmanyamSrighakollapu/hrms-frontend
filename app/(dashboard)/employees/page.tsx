"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

const EMPLOYEES = [
  { id: 1, name: "Rahul Verma", email: "rahul@hrms.local", dept: "Engineering", role: "Employee", status: "Active", join: "Jan 2024" },
  { id: 2, name: "Priya Nair", email: "priya@hrms.local", dept: "HR", role: "HR", status: "Active", join: "Mar 2022" },
  { id: 3, name: "Arjun Patel", email: "arjun@hrms.local", dept: "Engineering", role: "Manager", status: "Active", join: "Nov 2026" },
  { id: 4, name: "Anita Rao", email: "anita@hrms.local", dept: "Sales", role: "Employee", status: "Active", join: "Jun 2023" },
  { id: 5, name: "Karan Mehta", email: "karan@hrms.local", dept: "Engineering", role: "Manager", status: "Active", join: "Feb 2021" },
  { id: 6, name: "Sneha Iyer", email: "sneha@hrms.local", dept: "Finance", role: "Employee", status: "On Leave", join: "Aug 2023" },
  { id: 7, name: "Vikram Singh", email: "vikram@hrms.local", dept: "Finance", role: "Employee", status: "Active", join: "Nov 2026" },
  { id: 8, name: "Meera Joshi", email: "meera@hrms.local", dept: "HR", role: "Employee", status: "Active", join: "Nov 2026" },
];

const STATUS_STYLE: Record<string, string> = { Active: "badge-success", "On Leave": "badge-warning", Inactive: "badge-muted" };

export default function EmployeesPage() {
  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your organization's people"
        actions={
          <>
            <button className="btn-ghost border border-[var(--border)] px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm">
              <Icon name="Download" size={15} /> Export
            </button>
            <button className="btn-primary px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm">
              <Icon name="Plus" size={15} /> Add Employee
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: "Total", v: "248", i: "Users", c: "var(--brand-50)", f: "var(--brand-700)" },
          { l: "Active", v: "241", i: "Check", c: "var(--success-bg)", f: "var(--success)" },
          { l: "On Leave", v: "7", i: "CalendarDays", c: "var(--warning-bg)", f: "var(--warning)" },
          { l: "New (30d)", v: "12", i: "User", c: "var(--info-bg)", f: "var(--info)" },
        ].map((s) => (
          <div key={s.l} className="card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: s.c }}>
              <Icon name={s.i} size={19} style={{ color: s.f }} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)]">{s.l}</div>
              <div className="text-xl font-bold text-[var(--text)]">{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input placeholder="Search by name, email, department..." className="input-base pl-9 py-2 text-sm" />
          </div>
          <select className="input-base w-auto py-2 text-sm"><option>All Departments</option><option>Engineering</option><option>HR</option><option>Finance</option><option>Sales</option></select>
          <select className="input-base w-auto py-2 text-sm"><option>All Status</option><option>Active</option><option>On Leave</option></select>
          <button className="btn-ghost border border-[var(--border)] px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
            <Icon name="Filter" size={15} /> More Filters
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--slate-50)]">
              <tr className="text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium"><input type="checkbox" className="accent-[var(--brand-700)]" /></th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((e) => (
                <tr key={e.id} className="border-t border-[var(--border)] hover:bg-[var(--slate-50)]">
                  <td className="px-4 py-3"><input type="checkbox" className="accent-[var(--brand-700)]" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-white text-xs font-bold flex items-center justify-center">
                        {e.name.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text)]">{e.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{e.dept}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{e.role}</td>
                  <td className="px-4 py-3"><span className={`badge ${STATUS_STYLE[e.status]}`}>{e.status}</span></td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{e.join}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="h-7 w-7 rounded-md text-[var(--text-muted)] hover:bg-[var(--slate-100)] inline-flex items-center justify-center"><Icon name="MoreVertical" size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>Showing 8 of 248 employees</span>
          <div className="flex gap-1">
            <button className="h-8 w-8 rounded-md border border-[var(--border)] hover:bg-[var(--slate-50)] flex items-center justify-center">‹</button>
            <button className="h-8 w-8 rounded-md bg-[var(--brand-700)] text-white flex items-center justify-center">1</button>
            <button className="h-8 w-8 rounded-md border border-[var(--border)] hover:bg-[var(--slate-50)] flex items-center justify-center">2</button>
            <button className="h-8 w-8 rounded-md border border-[var(--border)] hover:bg-[var(--slate-50)] flex items-center justify-center">3</button>
            <button className="h-8 w-8 rounded-md border border-[var(--border)] hover:bg-[var(--slate-50)] flex items-center justify-center">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
