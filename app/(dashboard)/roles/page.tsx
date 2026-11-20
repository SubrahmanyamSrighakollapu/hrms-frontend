"use client";

import { useAuth } from "@/lib/auth-context";
import { useRbac } from "@/lib/rbac";
import { RolesTab } from "@/components/roles/RolesTab";

export default function RolesIndexPage() {
  const { can } = useAuth();
  const { roles, loading } = useRbac();

  if (loading) {
    return (
      <div className="card p-10 text-center text-sm text-[var(--text-muted)]">Loading roles…</div>
    );
  }

  return <RolesTab roles={roles} canManage={can("roles", "MANAGE")} />;
}
