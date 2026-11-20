"use client";

import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { StatCard } from "./_components/StatCard";
import { EmployeeDashboard } from "./_components/EmployeeDashboard";
import { AdminDashboard } from "./_components/AdminDashboard";
import { HrDashboard } from "./_components/HrDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: "linear-gradient(135deg, var(--brand-700), var(--brand-900))" }}>
        <div className="text-white">
          <h2 className="text-xl font-bold">Good day, {user?.name?.split(" ")[0] ?? "there"} 👋</h2>
          <p className="text-white/75 text-sm mt-1">{user?.title} • Here's your workspace overview</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost bg-white/15 text-white hover:bg-white/25 text-sm px-3.5 py-2 rounded-lg flex items-center gap-2">
            <Icon name="Plus" size={15} /> New Request
          </button>
          <button className="btn-ghost bg-white text-[var(--brand-700)] hover:bg-white/90 text-sm px-3.5 py-2 rounded-lg flex items-center gap-2">
            <Icon name="Download" size={15} /> Export
          </button>
        </div>
      </div>

      {/* Role-specific dashboard */}
      {user?.role === "ADMIN" && <AdminDashboard />}
      {user?.role === "HR" && <HrDashboard />}
      {user?.role === "EMPLOYEE" && <EmployeeDashboard />}
    </div>
  );
}
