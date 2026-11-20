"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AttendancePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Attendance" subtitle="Third-party attendance integration pending" />
      <div className="card p-8 text-center text-[var(--text-muted)]">
        <Icon name="Fingerprint" size={36} className="mx-auto mb-3 text-[var(--brand-300)]" />
        <p className="font-medium text-[var(--text)]">Attendance data is not connected</p>
        <p className="text-sm mt-1">Connect the approved third-party provider to enable attendance records and exports.</p>
      </div>
    </div>
  );
}
