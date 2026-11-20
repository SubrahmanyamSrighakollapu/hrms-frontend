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

export function Navbar({ onMenuClick, title, subtitle }: NavbarProps) {
  const { user, signOut } = useAuth();
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

  return (
    <header className="sticky top-0 z-30 h-[64px] flex items-center gap-4 px-4 lg:px-6 bg-white/80 backdrop-blur border-b border-[var(--border)]">
      <button
        onClick={onMenuClick}
        className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--slate-100)]"
      >
        <Icon name="Menu" size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="text-[1.05rem] font-bold text-[var(--text)] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex relative ml-auto max-w-sm w-full">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
        <input
          type="text"
          placeholder="Search employees, requests..."
          className="input-base pl-9 py-2 bg-[var(--slate-50)]"
        />
      </div>

      <div className="ml-auto md:ml-0 flex items-center gap-1.5">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--slate-100)] hover:text-[var(--text)]"
          >
            <Icon name="Bell" size={19} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--danger)] ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 card p-0 overflow-hidden fade-in" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-semibold text-sm">Notifications</span>
                <span className="badge badge-info">3 new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[
                  { t: "Leave request approved", d: "Your casual leave on Nov 22 has been approved.", s: "info" },
                  { t: "Payslip available", d: "October payslip is now available for download.", s: "success" },
                  { t: "Team message", d: "Priya sent you a message in the Engineering channel.", s: "warning" },
                ].map((n, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3 hover:bg-[var(--slate-50)] border-b border-[var(--border)] last:border-0 cursor-pointer">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.s === "success" ? "bg-[var(--success-bg)]" : n.s === "warning" ? "bg-[var(--warning-bg)]" : "bg-[var(--info-bg)]"}`}>
                      <Icon name="Bell" size={15} className={n.s === "success" ? "text-[var(--success)]" : n.s === "warning" ? "text-[var(--warning)]" : "text-[var(--info)]"} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text)]">{n.t}</div>
                      <div className="text-xs text-[var(--text-muted)] line-clamp-2">{n.d}</div>
                      <div className="text-[0.7rem] text-[var(--text-subtle)] mt-0.5">2 min ago</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 text-center border-t border-[var(--border)]">
                <a href="#" className="text-xs font-semibold text-[var(--brand-600)] hover:underline">View all notifications</a>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-[var(--slate-100)]"
          >
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))" }}>
              {user?.avatar ?? "U"}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-sm font-semibold leading-tight text-[var(--text)] truncate">{user?.name ?? "User"}</div>
              <div className="text-[0.7rem] text-[var(--text-muted)] truncate">{user?.title ?? user?.role}</div>
            </div>
            <Icon name="ChevronDown" size={15} className="text-[var(--text-muted)]" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 card p-1.5 overflow-hidden fade-in" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="px-3 py-2.5 border-b border-[var(--border)]">
                <div className="text-sm font-semibold text-[var(--text)]">{user?.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{user?.email}</div>
              </div>
              {[
                { label: "My Profile", href: "/my-info", icon: "User" },
                { label: "Settings", href: "/settings", icon: "Settings" },
              ].map((m) => (
                <Link key={m.label} href={m.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--text)] hover:bg-[var(--slate-50)]">
                  <Icon name={m.icon} size={16} className="text-[var(--text-muted)]" />
                  {m.label}
                </Link>
              ))}
              <div className="border-t border-[var(--border)] mt-1 pt-1">
                <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)]">
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
