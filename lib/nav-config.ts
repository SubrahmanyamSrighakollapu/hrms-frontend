export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  module: string; // module id from lib/rbac — drives visibility
  section?: string;
  badge?: string;
  /** Permission level required to see this item (defaults to VIEW). */
  level?: "VIEW" | "MANAGE";
  children?: NavItem[];
}

/** Navigation is grouped by section; each item is gated by a module permission. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", module: "dashboard", section: "Overview" },
  { label: "My Info", href: "/my-info", icon: "User", module: "my-info", section: "Overview" },
  {
    label: "Time Off",
    href: "/time-off",
    icon: "CalendarDays",
    module: "time-off",
    section: "Workplace",
    children: [
      { label: "Leaves", href: "/time-off/leaves", icon: "Leaf", module: "time-off" },
      { label: "Permissions", href: "/time-off/permissions", icon: "Clock", module: "time-off" },
      { label: "Regularization", href: "/time-off/regularization", icon: "RotateCcw", module: "time-off" },
      { label: "Extra Hours", href: "/time-off/extra-hours", icon: "Timer", module: "time-off" },
      { label: "Approvals", href: "/time-off/approvals", icon: "CheckCircle2", module: "time-off", level: "MANAGE" },
      { label: "Approval Flow", href: "/time-off/flows", icon: "ShieldCheck", module: "roles", level: "MANAGE" },
    ],
  },
  { label: "Attendance", href: "/attendance", icon: "Fingerprint", module: "attendance", section: "Workplace" },
  { label: "Payroll", href: "/payroll", icon: "Wallet", module: "payroll", section: "Workplace" },
  { label: "Holidays", href: "/holidays", icon: "CalendarDays", module: "holidays", section: "Workplace" },
  { label: "Policies", href: "/policies", icon: "FileText", module: "policies", section: "Workplace" },
  { label: "Desk Management", href: "/desk-management", icon: "Armchair", module: "desk-management", section: "Workplace" },
  { label: "Calendars", href: "/calendars", icon: "CalendarRange", module: "calendars", section: "Workplace" },
  { label: "Events", href: "/events", icon: "PartyPopper", module: "events", section: "Workplace" },
  { label: "IT Support", href: "/it-support", icon: "LifeBuoy", module: "it-support", section: "Workplace" },
  { label: "HR Help Desk", href: "/hr-helpdesk", icon: "Headphones", module: "hr-helpdesk", section: "Workplace" },
  { label: "Expenses", href: "/expenses", icon: "Receipt", module: "expenses", section: "Workplace" },
  { label: "Chat", href: "/chat", icon: "MessageSquare", module: "chat", section: "Workplace" },
  { label: "Employees", href: "/employees", icon: "Users", module: "employees", section: "Manage" },
  { label: "Reports", href: "/reports", icon: "BarChart3", module: "reports", section: "Manage" },
  {
    label: "Organization",
    href: "/organization",
    icon: "Building2",
    module: "organization",
    section: "Manage",
    children: [
      { label: "Departments", href: "/organization/departments", icon: "Layers", module: "organization" },
      { label: "Locations", href: "/organization/locations", icon: "MapPin", module: "organization" },
      { label: "Sub-locations", href: "/organization/sub-locations", icon: "Building", module: "organization" },
      { label: "Org Hierarchy", href: "/organization/hierarchy", icon: "Network", module: "organization" },
    ],
  },
  { label: "Roles & Permissions", href: "/roles", icon: "ShieldCheck", module: "roles", section: "Administration" },
  { label: "Settings", href: "/settings", icon: "Settings", module: "settings", section: "Administration" },
];

/** Ordered sections used to group the rail. */
export const NAV_SECTIONS = ["Overview", "Workplace", "Manage", "Administration"] as const;

/** Resolve which module a URL belongs to (longest matching nav href wins). */
export function moduleForPath(pathname: string): string | null {
  const flat: NavItem[] = NAV_ITEMS.flatMap((i) => [i, ...(i.children ?? [])]);
  const match = flat
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.module ?? null;
}
