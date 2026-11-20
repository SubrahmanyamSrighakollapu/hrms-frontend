"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export default function HierarchyPage() {
  return (
    <div>
      <PageHeader title="Organization Hierarchy" subtitle="Reporting structure across the organization" />
      <div className="card p-8">
        <div className="flex flex-col items-center gap-6">
          {/* CEO */}
          <Node name="Subrahmanyam S" role="Administrator" top />
          <Connector />
          <div className="flex gap-16">
            <div className="flex flex-col items-center gap-4">
              <Node name="Karan Mehta" role="Engineering Head" />
              <Connector />
              <div className="flex gap-8">
                <Node name="Rahul Verma" role="Software Engineer" small />
                <Node name="Arjun Patel" role="Software Engineer" small />
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Node name="Priya Nair" role="HR Manager" />
              <Connector />
              <Node name="Meera Joshi" role="HR Executive" small />
            </div>
            <div className="flex flex-col items-center gap-4">
              <Node name="Sneha Iyer" role="Finance Lead" />
              <Connector />
              <Node name="Vikram Singh" role="Finance Analyst" small />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Node({ name, role, top, small }: { name: string; role: string; top?: boolean; small?: boolean }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-white text-center ${small ? "px-3 py-2" : "px-5 py-3"} ${top ? "shadow-lg" : "shadow-sm"}`} style={top ? { borderColor: "var(--brand-300)" } : {}}>
      <div className={`rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-white font-bold flex items-center justify-center mx-auto mb-1.5 ${small ? "h-7 w-7 text-[0.65rem]" : "h-9 w-9 text-xs"}`}>
        {name.split(" ").map((w) => w[0]).join("")}
      </div>
      <div className={`font-semibold text-[var(--text)] ${small ? "text-xs" : "text-sm"}`}>{name}</div>
      <div className={`text-[var(--text-muted)] ${small ? "text-[0.7rem]" : "text-xs"}`}>{role}</div>
    </div>
  );
}

function Connector() {
  return <div className="w-px h-4 bg-[var(--border)]" />;
}
