"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Welcome back, here's what's happening today" },
  "/my-info": { title: "My Info", subtitle: "Your personal and employment details" },
  "/time-off": { title: "Time Off", subtitle: "Manage leaves, permissions, and approvals" },
  "/time-off/leaves": { title: "Leaves", subtitle: "Apply and track your leave requests" },
  "/time-off/permissions": { title: "Permissions", subtitle: "Short-duration time off requests" },
  "/time-off/regularization": { title: "Regularization", subtitle: "Fix missing attendance punches" },
  "/time-off/extra-hours": { title: "Extra Hours", subtitle: "Log overtime worked" },
  "/time-off/comp-off": { title: "Comp-off", subtitle: "Request compensatory time off" },
  "/time-off/wfh": { title: "Work From Home", subtitle: "Request remote work" },
  "/attendance": { title: "Attendance", subtitle: "Your attendance and punch records" },
  "/payroll": { title: "Payroll", subtitle: "View and download your payslips" },
  "/employees": { title: "Employees", subtitle: "Manage your organization's people" },
  "/chat": { title: "Chat", subtitle: "Connect with your team" },
  "/reports": { title: "Reports", subtitle: "Analytics and insights" },
  "/organization": { title: "Organization", subtitle: "Departments and structure" },
  "/organization/departments": { title: "Departments", subtitle: "Manage departments" },
  "/organization/hierarchy": { title: "Org Hierarchy", subtitle: "Reporting structure" },
  "/settings": { title: "Settings", subtitle: "Workspace configuration" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const meta = TITLES[pathname] ?? { title: "HRMS Workspace" };

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
        <main className="flex-1 p-4 lg:p-6 fade-in">{children}</main>
      </div>
      <FloatingChatbot />
    </div>
  );
}
