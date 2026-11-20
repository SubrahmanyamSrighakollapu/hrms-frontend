"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, type Role } from "@/lib/nav-config";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role: Role = user?.role ?? "EMPLOYEE";
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const visibleItems = NAV_ITEMS.filter((i) => i.roles.includes(role));

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-white border-r border-[var(--border)] transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[264px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ boxShadow: mobileOpen ? "var(--shadow-lg)" : "none" }}
      >
        {/* Brand */}
        <div className="h-[64px] flex items-center justify-between px-4 border-b border-[var(--border)] flex-shrink-0">
          <Logo showText={!collapsed} size={34} />
          <button
            onClick={onToggle}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--slate-100)] hover:text-[var(--text)]"
            aria-label="Toggle sidebar"
          >
            <Icon name={collapsed ? "ChevronRight" : "Menu"} size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleItems.map((item) => {
            const hasChildren = !!item.children?.length;
            const active = isActive(item.href);
            const groupOpen = openGroup === item.label || item.children?.some((c) => isActive(c.href));

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenGroup(groupOpen ? null : item.label)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                      ${active ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "text-[var(--slate-600)] hover:bg-[var(--slate-50)] hover:text-[var(--text)]"}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon name={item.icon} size={19} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        <Icon
                          name="ChevronDown"
                          size={15}
                          className={`transition-transform ${groupOpen ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && groupOpen && (
                    <div className="mt-1 ml-5 pl-3 border-l border-[var(--border)] space-y-0.5">
                      {item.children!.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          onClick={onCloseMobile}
                          className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.82rem] transition-colors
                            ${isActive(c.href)
                              ? "bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold"
                              : "text-[var(--text-muted)] hover:bg-[var(--slate-50)] hover:text-[var(--text)]"}`}
                        >
                          <Icon name={c.icon} size={15} />
                          <span className="truncate">{c.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                  ${active
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)] shadow-sm"
                    : "text-[var(--slate-600)] hover:bg-[var(--slate-50)] hover:text-[var(--text)]"}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={19} className="flex-shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="badge badge-danger">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-[var(--border)]">
            <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, var(--brand-700), var(--brand-900))" }}>
              <div className="text-white text-xs font-semibold">Need help?</div>
              <div className="text-white/70 text-[0.7rem] mt-0.5">Contact your administrator</div>
              <button className="mt-2 w-full bg-white/15 hover:bg-white/25 text-white text-xs font-medium py-1.5 rounded-md transition-colors">
                Get Support
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
