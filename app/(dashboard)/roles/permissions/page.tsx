"use client";

import { useAuth } from "@/lib/auth-context";
import { useRbac } from "@/lib/rbac";
import { PermissionsTab } from "@/components/roles/PermissionsTab";

export default function RolesPermissionsPage() {
  const { can } = useAuth();
  const { roles, loading } = useRbac();

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading permissions…</div>
    );
  }

  return <PermissionsTab roles={roles} canManage={can("roles", "MANAGE")} />;
}
