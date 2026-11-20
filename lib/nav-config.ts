export type Role = "ADMIN" | "HR" | "EMPLOYEE";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  roles: Role[];
  badge?: string;
  children?: NavItem[];
}

export const ROLES: Role[] = ["ADMIN", "HR", "EMPLOYEE"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { label: "My Info", href: "/my-info", icon: "User", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  {
    label: "Time Off", href: "/time-off", icon: "CalendarDays", roles: ["ADMIN", "HR", "EMPLOYEE"], children: [
      { label: "Leaves", href: "/time-off/leaves", icon: "Leaf", roles: ["ADMIN", "HR", "EMPLOYEE"] },
      { label: "Permissions", href: "/time-off/permissions", icon: "Clock", roles: ["ADMIN", "HR", "EMPLOYEE"] },
      { label: "Regularization", href: "/time-off/regularization", icon: "RotateCcw", roles: ["ADMIN", "HR", "EMPLOYEE"] },
      { label: "Extra Hours", href: "/time-off/extra-hours", icon: "Timer", roles: ["ADMIN", "HR", "EMPLOYEE"] },
      { label: "Comp-off", href: "/time-off/comp-off", icon: "Gift", roles: ["ADMIN", "HR", "EMPLOYEE"] },
      { label: "Work From Home", href: "/time-off/wfh", icon: "Home", roles: ["ADMIN", "HR", "EMPLOYEE"] },
    ] },
  { label: "Attendance", href: "/attendance", icon: "Fingerprint", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { label: "Payroll", href: "/payroll", icon: "Wallet", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { label: "Employees", href: "/employees", icon: "Users", roles: ["ADMIN", "HR"] },
  { label: "Chat", href: "/chat", icon: "MessageSquare", roles: ["ADMIN", "HR", "EMPLOYEE"] },
  { label: "Reports", href: "/reports", icon: "BarChart3", roles: ["ADMIN", "HR"] },
  {
    label: "Organization", href: "/organization", icon: "Building2", roles: ["ADMIN", "HR"], children: [
      { label: "Departments", href: "/organization/departments", icon: "Layers", roles: ["ADMIN", "HR"] },
      { label: "Org Hierarchy", href: "/organization/hierarchy", icon: "Network", roles: ["ADMIN", "HR"] },
    ] },
  { label: "Settings", href: "/settings", icon: "Settings", roles: ["ADMIN"] },
];

export const DEMO_USER: Record<Role, { name: string; email: string; role: Role; avatar: string; title: string }> = {
  ADMIN: { name: "Subrahmanyam S", email: "admin@hrms.local", role: "ADMIN", avatar: "SS", title: "Administrator" },
  HR: { name: "Priya Nair", email: "hr@hrms.local", role: "HR", avatar: "PN", title: "HR Manager" },
  EMPLOYEE: { name: "Rahul Verma", email: "employee@hrms.local", role: "EMPLOYEE", avatar: "RV", title: "Software Engineer" },
};
