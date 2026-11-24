"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";
import { useAuth } from "@/lib/auth-context";
import { moduleForPath } from "@/lib/nav-config";

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
  "/desk-management": { title: "Desk Management", subtitle: "Book a desk for the day" },
  "/calendars": { title: "Calendar", subtitle: "Birthdays, anniversaries, new joinees and holidays" },
  "/events": { title: "Events", subtitle: "Company events and RSVPs" },
  "/it-support": { title: "IT Support", subtitle: "Report technical issues and track IT requests" },
  "/hr-helpdesk": { title: "HR Help Desk", subtitle: "Ask HR questions and track employee queries" },
  "/expenses": { title: "Expenses", subtitle: "Submit claims, track approvals and reimbursements" },
  "/reports": { title: "Reports", subtitle: "Analytics and insights" },
  "/organization": { title: "Organization", subtitle: "Departments and structure" },
  "/organization/departments": { title: "Departments", subtitle: "Manage departments" },
  "/organization/hierarchy": { title: "Org Hierarchy", subtitle: "Reporting structure" },
  "/roles": { title: "Roles & Permissions", subtitle: "Create roles, grant module access, assign to employees" },
  "/roles/permissions": { title: "Permissions", subtitle: "Grant module access per role" },
  "/roles/assignee": { title: "Assignee", subtitle: "Assign employees to roles" },
  "/settings": { title: "Settings", subtitle: "Workspace configuration" },
};

/** Shown while the route is loading or the user is being redirected. */
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
  const { can, user, loading } = useAuth();

  const meta =
    TITLES[pathname] ??
    (pathname.startsWith("/employees/")
      ? { title: "Employee", subtitle: "Profile, classification and access" }
      : { title: "HRMS Workspace" });

  // Access is derived from the role assigned to the signed-in employee.
  const moduleId = moduleForPath(pathname);
  const allowed = !moduleId || can(moduleId);
  const isChatPage = pathname === "/chat";

  // No session → back to sign in.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Authenticated but no access to this module → send them to their dashboard
  // instead of showing a "No access" screen.
  useEffect(() => {
    if (!loading && user && !allowed) router.replace("/dashboard");
  }, [loading, user, allowed, router]);

  if (loading || !user || !allowed) {
    return <LayoutFallback />;
  }

  return (
    <div className={`${isChatPage ? "h-dvh overflow-hidden" : "min-h-screen"} flex bg-[var(--bg)]`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} title={meta.title} subtitle={meta.subtitle} />
        <main
          className={`relative flex-1 fade-in ${
            isChatPage ? "min-h-0 overflow-hidden p-0" : "p-4 lg:p-6"
          }`}
        >
          {children}
        </main>
      </div>
      <FloatingChatbot />
    </div>
  );
}
