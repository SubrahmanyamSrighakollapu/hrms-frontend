"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, NAV_SECTIONS, type NavItem } from "@/lib/nav-config";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { can } = useAuth();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Nav is gated by the module permissions of the signed-in employee's role.
  const canSee = (item: NavItem) => can(item.module, item.level ?? "VIEW");
  const visibleItems = NAV_ITEMS
    .filter(canSee)
    .map((i) => ({ ...i, children: i.children?.filter(canSee) }))
    .filter((i) => !i.children || i.children.length > 0);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const grouped = NAV_SECTIONS.map((section) => ({
    section,
    items: visibleItems.filter((i) => (i.section ?? "Workplace") === section),
  })).filter((g) => g.items.length > 0);

  const itemClass = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[0.845rem] transition-colors duration-150
     ${active
       ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
       : "text-[var(--text-muted)] font-medium hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`;

  const ActiveBar = () => (
    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--brand-600)]" />
  );

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onCloseMobile}
        title={collapsed ? item.label : undefined}
        className={`${itemClass(active)} ${collapsed ? "justify-center px-0" : ""}`}
      >
        {active && <ActiveBar />}
        <Icon name={item.icon} size={18} className="flex-shrink-0" />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && item.badge && <span className="badge badge-brand">{item.badge}</span>}
      </Link>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-250 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[264px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ boxShadow: mobileOpen ? "var(--shadow-lg)" : "none" }}
      >
        {/* Brand */}
        <div className="h-[64px] flex items-center justify-between px-4 border-b border-[var(--border)] flex-shrink-0">
          <Logo showText={!collapsed} size={32} />
          <button
            onClick={onToggle}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
            aria-label="Toggle sidebar"
          >
            <Icon name={collapsed ? "ChevronRight" : "ChevronsLeft"} size={17} />
          </button>
          <button
            onClick={onCloseMobile}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-[var(--text-subtle)] hover:bg-[var(--surface-2)]"
            aria-label="Close menu"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {grouped.map(({ section, items }) => (
            <div key={section} className="space-y-1">
              {!collapsed ? (
                <div className="px-3 pb-1.5">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                    {section}
                  </span>
                </div>
              ) : (
                <div className="mx-3 mb-2 h-px bg-[var(--border)]" />
              )}

              {items.map((item) => {
                const hasChildren = !!item.children?.length;

                if (hasChildren) {
                  const active = isActive(item.href);
                  const groupOpen = openGroup === item.label || !!item.children?.some((c) => isActive(c.href));
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setOpenGroup(groupOpen ? null : item.label)}
                        title={collapsed ? item.label : undefined}
                        className={`w-full ${itemClass(active)} ${collapsed ? "justify-center px-0" : ""}`}
                      >
                        {active && <ActiveBar />}
                        <Icon name={item.icon} size={18} className="flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            <Icon
                              name="ChevronDown"
                              size={15}
                              className={`transition-transform duration-200 ${groupOpen ? "rotate-180" : ""}`}
                            />
                          </>
                        )}
                      </button>

                      {!collapsed && groupOpen && (
                        <div className="mt-1 ml-5 pl-3.5 border-l border-[var(--border)] space-y-0.5">
                          {item.children!.map((c) => {
                            const cActive = isActive(c.href);
                            return (
                              <Link
                                key={c.href}
                                href={c.href}
                                onClick={onCloseMobile}
                                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] transition-colors
                                  ${cActive
                                    ? "text-[var(--brand-700)] font-semibold"
                                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"}`}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                  style={{ background: cActive ? "var(--brand-500)" : "var(--slate-300)" }}
                                />
                                <span className="truncate">{c.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return renderItem(item);
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          {!collapsed ? (
            <div className="panel-2 p-3.5">
              <div className="flex items-center gap-2 text-[0.8rem] font-semibold text-[var(--text)]">
                <Icon name="Sparkles" size={14} className="text-[var(--brand-600)]" />
                Need a hand?
              </div>
              <p className="text-[var(--text-muted)] text-[0.72rem] mt-1 leading-relaxed">
                Reach your HR admin or browse the help centre.
              </p>
              <button className="mt-2.5 w-full btn-ghost py-1.5 text-xs">
                Get support
              </button>
            </div>
          ) : (
            <button
              className="w-full h-10 flex items-center justify-center rounded-lg text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
              title="Support"
            >
              <Icon name="Sparkles" size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
