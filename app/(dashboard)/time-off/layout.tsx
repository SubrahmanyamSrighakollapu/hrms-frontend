"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";

interface TabDef {
  id: string;
  label: string;
  href: string;
  icon: string;
  /** Hide unless the user can manage the given module. */
  manage?: string;
}

const TABS: TabDef[] = [
  { id: "leaves", label: "Leaves", href: "/time-off/leaves", icon: "Leaf" },
  { id: "permissions", label: "Permissions", href: "/time-off/permissions", icon: "Clock" },
  { id: "regularization", label: "Regularization", href: "/time-off/regularization", icon: "RotateCcw" },
  { id: "extra-hours", label: "Extra Hours", href: "/time-off/extra-hours", icon: "Timer" },
  { id: "approvals", label: "Approvals", href: "/time-off/approvals", icon: "CheckCircle2", manage: "time-off" },
  { id: "flows", label: "Approval Flow", href: "/time-off/flows", icon: "ShieldCheck", manage: "roles" },
];

/** Shared shell for the Time Off module — header + route-driven tab navigation. */
export default function TimeOffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { can } = useAuth();

  const visibleTabs = TABS.filter((t) => !t.manage || can(t.manage, "MANAGE"));

  return (
    <div>
      <PageHeader
        title="Time Off"
        subtitle="Apply for leaves, permissions, regularization and extra hours — then track approvals"
      />

      <nav className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {visibleTabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`relative inline-flex items-center gap-1.5 px-4 py-2.5 text-[0.84rem] whitespace-nowrap transition-colors ${
                active
                  ? "text-[var(--brand-700)] font-semibold"
                  : "text-[var(--text-muted)] font-medium hover:text-[var(--text)]"
              }`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
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
