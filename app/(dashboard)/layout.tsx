"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { moduleForPath } from "@/lib/nav-config";
import { MODULES } from "@/lib/rbac";
import Link from "next/link";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Welcome back, here's what's happening today" },
  "/my-info": { title: "My Info", subtitle: "Your personal and employment details" },
  "/time-off": { title: "Time Off", subtitle: "Manage leaves, permissions, and approvals" },
  "/time-off/leaves": { title: "Leaves", subtitle: "Apply and track your leave requests" },
  "/time-off/permissions": { title: "Permissions", subtitle: "Short-duration time off requests" },
  "/time-off/regularization": { title: "Regularization", subtitle: "Fix missing attendance punches" },
  "/time-off/extra-hours": { title: "Extra Hours", subtitle: "Log overtime worked" },
  "/time-off/approvals": { title: "Approvals", subtitle: "Review and act on time-off requests" },
  "/time-off/flows": { title: "Approval Flow", subtitle: "Configure which role approves each request type" },
  "/attendance": { title: "Attendance", subtitle: "Your attendance and punch records" },
  "/payroll": { title: "Payroll", subtitle: "View and download your payslips" },
  "/employees": { title: "Employees", subtitle: "Manage your organization's people" },
  "/chat": { title: "Chat", subtitle: "Connect with your team" },
  "/reports": { title: "Reports", subtitle: "Analytics and insights" },
  "/organization": { title: "Organization", subtitle: "Departments and structure" },
  "/organization/departments": { title: "Departments", subtitle: "Manage departments" },
  "/organization/hierarchy": { title: "Org Hierarchy", subtitle: "Reporting structure" },
  "/roles": { title: "Roles & Permissions", subtitle: "Create roles, grant module access, assign to employees" },
  "/roles/permissions": { title: "Permissions", subtitle: "Grant module access per role" },
  "/roles/assignee": { title: "Assignee", subtitle: "Assign employees to roles" },
  "/settings": { title: "Settings", subtitle: "Workspace configuration" },
};

/** Shown when the signed-in role has no access to the requested module. */
function NoAccess({ moduleLabel, roleName }: { moduleLabel: string; roleName?: string }) {
  return (
    <div className="card p-10 max-w-lg mx-auto text-center fade-in">
      <div className="h-12 w-12 rounded-xl bg-[var(--danger-bg)] text-[var(--danger)] flex items-center justify-center mx-auto">
        <Icon name="ShieldCheck" size={22} />
      </div>
      <h3 className="mt-4 text-[1rem] font-semibold text-[var(--text)]">No access to {moduleLabel}</h3>
      <p className="text-[0.85rem] text-[var(--text-muted)] mt-1.5 leading-relaxed">
        Your role{roleName ? ` (${roleName})` : ""} does not include this module.
        Ask your administrator to grant it under Roles &amp; Permissions.
      </p>
      <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 h-9 px-4 mt-5 text-[0.84rem]">
        Back to dashboard
      </Link>
    </div>
  );
}

function LayoutFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <span className="h-6 w-6 border-2 border-[var(--border-strong)] border-t-[var(--brand-600)] rounded-full animate-spin" />
    </div>
  );
}

/**
 * The shell reads `usePathname()`, which cannot be resolved while prerendering
 * a route with an unknown dynamic param (e.g. `/employees/[id]`). The Suspense
 * boundary lets those routes stream in without breaking the build.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LayoutFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { can, role, user, loading } = useAuth();

  // No session → back to sign in.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const meta =
    TITLES[pathname] ??
    (pathname.startsWith("/employees/")
      ? { title: "Employee", subtitle: "Profile, classification and access" }
      : { title: "HRMS Workspace" });

  // Access is derived from the role assigned to the signed-in employee.
  const moduleId = moduleForPath(pathname);
  const moduleLabel = MODULES.find((m) => m.id === moduleId)?.label ?? "this area";
  const allowed = !moduleId || can(moduleId);

  if (loading || !user) {
    return <LayoutFallback />;
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setMobileOpen(true)} title={meta.title} subtitle={meta.subtitle} />
        <main className="relative flex-1 p-4 lg:p-6 fade-in">
          {allowed ? children : <NoAccess moduleLabel={moduleLabel} roleName={role?.name} />}
        </main>
      </div>
      <FloatingChatbot />
    </div>
  );
}
