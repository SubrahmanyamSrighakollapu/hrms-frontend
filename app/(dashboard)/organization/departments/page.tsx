"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

const DEPTS = [
  { name: "Engineering", count: 86, head: "Karan Mehta", color: "var(--brand-500)" },
  { name: "Sales", count: 54, head: "Anita Rao", color: "var(--success)" },
  { name: "HR", count: 18, head: "Priya Nair", color: "var(--warning)" },
  { name: "Finance", count: 24, head: "Sneha Iyer", color: "var(--info)" },
  { name: "Operations", count: 66, head: "Vikram Singh", color: "#8b5cf6" },
];

export default function DepartmentsPage() {
  return (
    <div>
      <PageHeader title="Departments" subtitle="Manage your organization's departments" actions={
        <button className="btn-primary px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm"><Icon name="Plus" size={15} /> Add Department</button>
      } />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEPTS.map((d) => (
          <div key={d.name} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: d.color }}>
                <Icon name="Layers" size={22} />
              </div>
              <button className="h-7 w-7 rounded-md text-[var(--text-muted)] hover:bg-[var(--slate-100)] flex items-center justify-center"><Icon name="MoreVertical" size={16} /></button>
            </div>
            <h3 className="font-bold text-[var(--text)] mt-3">{d.name}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-[var(--text-muted)]"><span className="font-bold text-[var(--text)]">{d.count}</span> members</span>
              <span className="text-[var(--text-muted)]">Head: <span className="font-medium text-[var(--text)]">{d.head}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
