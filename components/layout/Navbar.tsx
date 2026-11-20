"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

const NOTIFS = [
  { t: "Leave request approved", d: "Your casual leave on Nov 22 has been approved.", i: "CheckCircle2", tone: "success" },
  { t: "Payslip available", d: "October payslip is now available for download.", i: "Wallet", tone: "info" },
  { t: "Priya sent you a message", d: "In the Engineering channel.", i: "MessageSquare", tone: "warning" },
];

export function Navbar({ onMenuClick, title, subtitle }: NavbarProps) {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => {
    signOut();
    router.push("/login");
  };

  const tone: Record<string, { bg: string; fg: string }> = {
    success: { bg: "var(--success-bg)", fg: "var(--success)" },
    info: { bg: "var(--info-bg)", fg: "var(--info)" },
    warning: { bg: "var(--warning-bg)", fg: "var(--warning)" },
  };

  return (
    <header className="sticky top-0 z-30 h-[64px] flex items-center gap-3 px-4 lg:px-6 bg-[var(--surface)] border-b border-[var(--border)]">
      <button
        onClick={onMenuClick}
        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
      >
        <Icon name="Menu" size={20} />
      </button>

      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-[0.95rem] font-semibold text-[var(--text)] truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-[0.72rem] text-[var(--text-subtle)] truncate">{subtitle}</p>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <button className="hidden md:flex w-[280px] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface)] px-3 py-2 text-left transition-colors">
          <Icon name="Search" size={15} className="text-[var(--text-subtle)]" />
          <span className="flex-1 text-[0.82rem] text-[var(--text-subtle)]">Search…</span>
          <span className="kbd">⌘K</span>
        </button>

        {/* Quick create */}
        <button className="hidden sm:flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] px-3 text-[0.82rem] font-semibold text-white transition-colors">
          <Icon name="Plus" size={15} />
          <span className="hidden lg:inline">New</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Icon name="Bell" size={18} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[20rem] card p-0 overflow-hidden fade-in" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-semibold text-sm">Notifications</span>
                <span className="badge badge-brand">3 new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {NOTIFS.map((n, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3 hover:bg-[var(--surface-2)] border-b border-[var(--border)] last:border-0 cursor-pointer transition-colors">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tone[n.tone].bg, color: tone[n.tone].fg }}>
                      <Icon name={n.i} size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.83rem] font-medium text-[var(--text)]">{n.t}</div>
                      <div className="text-xs text-[var(--text-muted)] line-clamp-2">{n.d}</div>
                      <div className="text-[0.7rem] text-[var(--text-subtle)] mt-0.5">2 min ago</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 text-center border-t border-[var(--border)]">
                <a href="#" className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]">View all notifications</a>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-50)] text-[0.72rem] font-bold text-[var(--brand-700)]">
              {user?.avatar ?? "U"}
            </span>
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-[0.83rem] font-semibold leading-tight text-[var(--text)] truncate">{user?.name ?? "User"}</div>
              <div className="text-[0.68rem] text-[var(--text-subtle)] truncate">{role?.name ?? user?.title}</div>
            </div>
            <Icon name="ChevronDown" size={15} className="text-[var(--text-subtle)]" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 card p-0 overflow-hidden fade-in" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="p-3.5 flex items-center gap-3 bg-[var(--surface-2)] border-b border-[var(--border)]">
                <span className="h-10 w-10 rounded-full flex items-center justify-center bg-[var(--brand-50)] text-[var(--brand-700)] text-sm font-bold">
                  {user?.avatar}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text)] truncate">{user?.name}</div>
                  <div className="text-[0.7rem] text-[var(--text-muted)] truncate">{user?.email}</div>
                </div>
              </div>
              <div className="p-1.5">
                {[
                  { label: "My Profile", href: "/my-info", icon: "User" },
                  { label: "Settings", href: "/settings", icon: "Settings" },
                ].map((m) => (
                  <Link key={m.label} href={m.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text)] hover:bg-[var(--surface-2)]">
                    <Icon name={m.icon} size={16} className="text-[var(--text-muted)]" />
                    {m.label}
                  </Link>
                ))}
              </div>
              <div className="p-1.5 pt-0 border-t border-[var(--border)]">
                <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)]">
                  <Icon name="LogOut" size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
