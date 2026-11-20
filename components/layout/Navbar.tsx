"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications";

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

function notificationIconName(kind: string): string {
  if (kind.startsWith("TIME_OFF")) return "CalendarDays";
  if (kind.startsWith("PAYSLIP")) return "Wallet";
  if (kind.startsWith("CHAT")) return "MessageSquare";
  return "Bell";
}

export function Navbar({ onMenuClick, title, subtitle }: NavbarProps) {
  const { user, role, signOut, can } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(false);
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

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const refresh = async () => {
      try {
        const result = await listNotifications();
        if (!active) return;
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
        setNotificationsError(false);
      } catch {
        if (active) setNotificationsError(true);
      } finally {
        if (active) setNotificationsLoading(false);
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const markOneRead = async (notification: AppNotification) => {
    if (notification.readAt) return;
    setNotifications((items) =>
      items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(notification.id);
    } catch {
      setNotificationsError(true);
    }
  };

  const markAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setNotificationsError(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[64px] flex items-center gap-3 px-4 lg:px-6 bg-[var(--surface)] border-b border-[var(--border)]">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
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
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
            aria-expanded={notifOpen}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Icon name="Bell" size={18} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-[var(--danger)] text-white text-[0.6rem] leading-4 text-center ring-2 ring-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1rem))] card p-0 overflow-hidden fade-in" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={() => void markAllRead()} className="text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading && notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Loading notifications…</div>
                ) : notificationsError && notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[var(--danger)]">Could not load notifications.</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">You’re all caught up.</div>
                ) : notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => {
                      void markOneRead(notification);
                      setNotifOpen(false);
                    }}
                    className={`flex gap-3 px-4 py-3 hover:bg-[var(--surface-2)] border-b border-[var(--border)] last:border-0 transition-colors ${notification.readAt ? "" : "bg-[var(--brand-50)]/50"}`}
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--brand-50)] text-[var(--brand-700)]">
                      <Icon name={notificationIconName(notification.kind)} size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.83rem] font-medium text-[var(--text)]">{notification.title}</div>
                      <div className="text-xs text-[var(--text-muted)] line-clamp-2">{notification.body}</div>
                      <div className="text-[0.7rem] text-[var(--text-subtle)] mt-0.5">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {notificationsError && notifications.length > 0 && <div className="px-4 py-2 text-xs text-[var(--danger)]">Some notification updates could not be saved.</div>}
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
                  ...(can("settings") ? [{ label: "Settings", href: "/settings", icon: "Settings" }] : []),
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
