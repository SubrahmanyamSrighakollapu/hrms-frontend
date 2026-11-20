"use client";

import { useAuth } from "@/lib/auth-context";
import { useRbac } from "@/lib/rbac";
import { AssigneeTab } from "@/components/roles/AssigneeTab";

export default function RolesAssigneePage() {
  const { can } = useAuth();
  const { roles, employees, loading } = useRbac();

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading assignees…</div>
    );
  }

  return (
    <AssigneeTab
      roles={roles}
      employees={employees}
      canManage={can("roles", "MANAGE")}
    />
  );
}
