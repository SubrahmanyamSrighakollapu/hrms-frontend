"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { MODULES, useRbac } from "@/lib/rbac";

interface TabDef {
  id: string;
  label: string;
  href: string;
}

const TABS: TabDef[] = [
  { id: "roles", label: "Roles", href: "/roles" },
  { id: "permissions", label: "Permissions", href: "/roles/permissions" },
  { id: "assignee", label: "Assignee", href: "/roles/assignee" },
];

/** Shared shell for the Roles module — header + route-driven tab navigation. */
export default function RolesLayout({ children }: { children: React.ReactNode }) {
  const { can } = useAuth();
  const { roles, employees } = useRbac();

  if (!can("roles")) {
    return (
      <div className="mx-auto max-w-lg card p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--danger-bg)] text-[var(--danger)]">
          <Icon name="ShieldCheck" size={22} />
        </div>
        <h3 className="mt-4 font-semibold text-[var(--text)]">Restricted area</h3>
        <p className="mt-1.5 text-[0.85rem] text-[var(--text-muted)]">
          Only roles with the Roles &amp; Permissions module can open this page.
        </p>
      </div>
    );
  }

  const pathname = usePathname();
  const countFor = (id: string) => {
    if (id === "roles") return roles.length;
    if (id === "permissions") return MODULES.length;
    if (id === "assignee") return employees.length;
    return undefined;
  };

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Create roles, grant module access, then assign the role to employees"
      />

      <nav className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {TABS.map((t) => {
          const active = t.href === pathname;
          const count = countFor(t.id);
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`relative px-4 py-2.5 text-[0.84rem] whitespace-nowrap transition-colors ${
                active
                  ? "text-[var(--brand-700)] font-semibold"
                  : "text-[var(--text-muted)] font-medium hover:text-[var(--text)]"
              }`}
            >
              {t.label}
              {count !== undefined && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                    active ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "bg-[var(--slate-100)] text-[var(--text-muted)]"
                  }`}
                >
                  {count}
                </span>
              )}
              {active && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[var(--brand-600)] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 fade-in">{children}</div>
    </div>
  );
}
