"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";

interface Position { x: number; y: number; }

const STORAGE_KEY = "hrms.chatbot.pos";

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);
  const [messages, setMessages] = useState<{ from: "bot" | "user"; text: string }[]>([
    { from: "bot", text: "Hi! I'm your HR assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
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

  const send = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: autoReply(text) }]);
    }, 600);
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
                <Icon name="Bot" size={17} />
              </div>
              <div>
                <div className="text-[0.83rem] font-semibold leading-tight">HR Assistant</div>
                <div className="text-[0.7rem] text-white/65 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/70" /> Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-md hover:bg-white/15 flex items-center justify-center">
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-[300px] overflow-y-auto p-3.5 space-y-2.5 bg-[var(--surface-2)]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-[0.83rem] leading-relaxed ${
                    m.from === "user"
                      ? "bg-[var(--brand-600)] text-white rounded-br-md"
                      : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick suggestions */}
          <div className="px-3.5 py-2 flex flex-wrap gap-1.5 bg-[var(--surface-2)] border-t border-[var(--border)]">
            {["Leave balance", "Apply leave", "My payslip", "Contact HR"].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-[0.7rem] px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand-700)] hover:border-[var(--brand-200)] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-2.5 border-t border-[var(--border)] bg-[var(--surface)]">
            <button className="h-8 w-8 rounded-md text-[var(--text-subtle)] hover:bg-[var(--surface-2)] flex items-center justify-center">
              <Icon name="Paperclip" size={16} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="flex-1 input-base py-2 text-[0.83rem]"
            />
            <button
              onClick={send}
              className="h-8 w-8 rounded-lg bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white flex items-center justify-center transition-colors"
            >
              <Icon name="Send" size={15} />
            </button>
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
        title="Drag me anywhere • Click to chat"
      >
        {open ? <Icon name="X" size={21} /> : <Icon name="MessageSquare" size={21} />}
      </button>
    </>
  );
}

function autoReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("leave") && t.includes("balance")) return "You have 6 casual days, 4 sick days, and 2 earned leaves remaining this year. Would you like to apply for leave?";
  if (t.includes("apply")) return "Sure! You can apply for leave from Time Off → Leaves. What type of leave do you need?";
  if (t.includes("payslip")) return "Your October payslip is available under Payroll. You can download it there.";
  if (t.includes("contact") || t.includes("hr")) return "You can reach HR at hr@hrms.local or use the Chat module to message Priya directly.";
  return "I can help with leave, attendance, payroll, and general HR queries. Try asking about your leave balance or payslips!";
}
