"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AttendancePage() {
  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your attendance and punch records" actions={
        <button className="btn-ghost border border-[var(--border)] px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm"><Icon name="Download" size={15} /> Export</button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: "Present", v: "18", i: "Check", c: "var(--success-bg)", f: "var(--success)" },
          { l: "Absent", v: "1", i: "XCircle", c: "var(--danger-bg)", f: "var(--danger)" },
          { l: "Late", v: "2", i: "Clock3", c: "var(--warning-bg)", f: "var(--warning)" },
          { l: "Half Day", v: "1", i: "Clock", c: "var(--info-bg)", f: "var(--info)" },
        ].map((s) => (
          <div key={s.l} className="card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: s.c }}><Icon name={s.i} size={19} style={{ color: s.f }} /></div>
            <div><div className="text-xs text-[var(--text-muted)]">{s.l}</div><div className="text-xl font-bold text-[var(--text)]">{s.v}</div></div>
          </div>
        ))}
      </div>
      <div className="card p-8 text-center text-[var(--text-muted)]">
        <Icon name="Fingerprint" size={36} className="mx-auto mb-3 text-[var(--brand-300)]" />
        <p className="font-medium text-[var(--text)]">Attendance calendar</p>
        <p className="text-sm mt-1">Monthly attendance view will appear here once data is connected.</p>
      </div>
    </div>
  );
}
