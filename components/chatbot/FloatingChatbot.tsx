"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";

interface Position { x: number; y: number; }

const STORAGE_KEY = "hrms.chatbot.pos";

export function FloatingChatbot() {
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const draggingRef = useRef(false);
  const posRef = useRef<Position | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Load saved position (anchored to bottom-right by default)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        // Read browser-only persisted placement after mount to avoid hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPos(p);
        posRef.current = p;
        return;
      } catch { /* ignore */ }
    }
    const p = { x: window.innerWidth - 76, y: window.innerHeight - 76 };
    setPos(p);
    posRef.current = p;
  }, []);

  const savePos = useCallback((p: Position) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!fabRef.current) return;
    const rect = fabRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    moved.current = false;
    draggingRef.current = true;
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const nx = ev.clientX - dragOffset.current.x;
      const ny = ev.clientY - dragOffset.current.y;
      const maxX = window.innerWidth - 56;
      const maxY = window.innerHeight - 56;
      const clamped = {
        x: Math.max(8, Math.min(maxX, nx)),
        y: Math.max(8, Math.min(maxY, ny)),
      };
      if (Math.abs(ev.movementX) + Math.abs(ev.movementY) > 2) moved.current = true;
      posRef.current = clamped;
      setPos(clamped);
    };
    const onUp = () => {
      if (draggingRef.current && posRef.current) savePos(posRef.current);
      draggingRef.current = false;
      setDragging(false);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const handleClick = () => {
    if (moved.current) return; // was a drag, don't toggle
    setOpen((o) => !o);
  };

  if (!pos) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-[60] w-[340px] max-w-[calc(100vw-16px)] card p-0 overflow-hidden fade-in"
          style={{
            right: Math.min(window.innerWidth - pos.x - 56, window.innerWidth - 356) < 8 ? undefined : window.innerWidth - pos.x - 56,
            left: window.innerWidth - pos.x < 356 ? 8 : undefined,
            bottom: window.innerHeight - pos.y < 480 ? 8 : undefined,
            top: window.innerHeight - pos.y < 480 ? undefined : pos.y - 430,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--brand-600)] text-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
                <Icon name="Command" size={17} />
              </div>
              <div>
                <div className="text-[0.83rem] font-semibold leading-tight">HRMS shortcuts</div>
                <div className="text-[0.7rem] text-white/65">Open an available module</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close shortcuts"
              className="h-7 w-7 rounded-md hover:bg-white/15 flex items-center justify-center"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="p-2.5 bg-[var(--surface-2)]">
            {[
              { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", allowed: can("dashboard") },
              { label: "My Info", href: "/my-info", icon: "User", allowed: can("my-info") },
              { label: "Time Off", href: "/time-off", icon: "CalendarDays", allowed: can("time-off") },
              { label: "Payroll", href: "/payroll", icon: "Wallet", allowed: can("payroll") },
              { label: "Team Chat", href: "/chat", icon: "MessageSquare", allowed: can("chat") },
              { label: "Reports", href: "/reports", icon: "BarChart3", allowed: can("reports") },
            ].filter((item) => item.allowed).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
              >
                <Icon name={item.icon} size={16} className="text-[var(--brand-600)]" />
                {item.label}
                <Icon name="ArrowRight" size={14} className="ml-auto text-[var(--text-subtle)]" />
              </Link>
            ))}
            <p className="px-3 pt-2 text-[0.68rem] text-[var(--text-subtle)]">
              Conversational assistance is not connected yet.
            </p>
          </div>
        </div>
      )}

      {/* Floating action button (draggable) */}
      <button
        ref={fabRef}
        onPointerDown={onPointerDown}
        onClick={handleClick}
        className="fixed z-[60] rounded-full flex items-center justify-center text-white cursor-grab active:cursor-grabbing touch-none select-none bg-[var(--brand-600)] hover:bg-[var(--brand-700)] transition-colors"
        style={{
          left: pos.x,
          top: pos.y,
          width: 52,
          height: 52,
          boxShadow: dragging ? "var(--shadow-lg)" : "0 6px 18px -4px rgba(37,99,235,0.45)",
        }}
        title="Drag me anywhere or open HRMS shortcuts"
      >
        {open ? <Icon name="X" size={21} /> : <Icon name="MessageSquare" size={21} />}
      </button>
    </>
  );
}
