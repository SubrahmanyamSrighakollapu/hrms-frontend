"use client";

import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth-context";

export default function MyInfoPage() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="My Info" subtitle="Your personal and employment details" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="card p-6 text-center">
          <div className="h-24 w-24 rounded-full mx-auto bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-white text-3xl font-bold flex items-center justify-center mb-3">
            {user?.avatar ?? "U"}
          </div>
          <h3 className="text-lg font-bold text-[var(--text)]">{user?.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">{user?.title}</p>
          <span className="badge badge-brand mt-2" style={{ background: "var(--brand-50)", color: "var(--brand-700)" }}>{user?.role}</span>
          <div className="mt-5 space-y-2.5 text-left">
            {[
              { i: "Mail", l: user?.email ?? "—" },
              { i: "Phone", l: "+91 98765 43210" },
              { i: "Briefcase", l: "Engineering" },
              { i: "MapPin", l: "Bengaluru, India" },
            ].map((x) => (
              <div key={x.l} className="flex items-center gap-3 text-sm">
                <Icon name={x.i} size={15} className="text-[var(--text-muted)]" />
                <span className="text-[var(--text)]">{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--text)] mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ["Full Name", user?.name ?? "—"], ["Employee ID", "EMP-1042"],
                ["Date of Birth", "12 Mar 1996"], ["Gender", "Male"],
                ["Blood Group", "O+"], ["Marital Status", "Single"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-xs text-[var(--text-muted)]">{l}</div>
                  <div className="font-medium text-[var(--text)] mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--text)] mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ["Designation", user?.title ?? "—"], ["Department", "Engineering"],
                ["Reporting Manager", "Karan Mehta"], ["Date of Joining", "15 Jan 2024"],
                ["Employment Type", "Full-time"], ["Work Location", "Hybrid"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-xs text-[var(--text-muted)]">{l}</div>
                  <div className="font-medium text-[var(--text)] mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
