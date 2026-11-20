"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

const CONVERSATIONS = [
  { id: 1, name: "Priya Nair", role: "HR Manager", last: "Sure, I'll check and get back to you.", time: "10:24 AM", unread: 2, online: true },
  { id: 2, name: "Engineering Team", role: "8 members", last: "Arjun: PR is ready for review", time: "09:50 AM", unread: 5, online: true, group: true },
  { id: 3, name: "Karan Mehta", role: "Reporting Manager", last: "Thanks for the update!", time: "Yesterday", unread: 0, online: false },
  { id: 4, name: "General", role: "Company-wide", last: "Reminder: Townhall at 4 PM", time: "Yesterday", unread: 0, online: true, group: true },
  { id: 5, name: "Sneha Iyer", role: "Finance", last: "Payslip has been uploaded", time: "Mon", unread: 0, online: false },
];

const MESSAGES = [
  { from: "them", text: "Hi Rahul, how's the project going?", time: "10:15 AM" },
  { from: "me", text: "Going well, Priya! We're on track for the Nov 30 deadline.", time: "10:18 AM" },
  { from: "them", text: "Great to hear. Do you need any additional resources?", time: "10:20 AM" },
  { from: "me", text: "We might need one more QA engineer for the final sprint.", time: "10:22 AM" },
  { from: "them", text: "Sure, I'll check and get back to you.", time: "10:24 AM" },
];

export default function ChatPage() {
  const [active, setActive] = useState(1);
  const [msg, setMsg] = useState("");

  return (
    <div className="-m-4 lg:-m-6">
      <div className="card rounded-none lg:rounded-xl overflow-hidden h-[calc(100vh-140px)] flex">
        {/* Conversation list */}
        <div className="w-72 border-r border-[var(--border)] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--text)]">Messages</h3>
              <button className="h-8 w-8 rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center">
                <Icon name="Plus" size={16} />
              </button>
            </div>
            <div className="relative">
              <Icon name="Search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
              <input placeholder="Search..." className="input-base pl-8 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {CONVERSATIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex gap-3 p-3 text-left border-b border-[var(--border)] transition-colors ${
                  active === c.id ? "bg-[var(--brand-50)]" : "hover:bg-[var(--slate-50)]"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-white text-sm font-bold flex items-center justify-center">
                    {c.group ? <Icon name="Users" size={16} /> : c.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  {c.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[var(--success)] ring-2 ring-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[var(--text)] truncate">{c.name}</span>
                    <span className="text-[0.7rem] text-[var(--text-subtle)] flex-shrink-0 ml-1">{c.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-xs text-[var(--text-muted)] truncate">{c.last}</span>
                    {c.unread > 0 && <span className="h-4 min-w-4 px-1 rounded-full bg-[var(--brand-700)] text-white text-[0.65rem] font-bold flex items-center justify-center flex-shrink-0 ml-1">{c.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 p-3.5 border-b border-[var(--border)]">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-white text-sm font-bold flex items-center justify-center">PN</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--text)]">Priya Nair</div>
              <div className="text-xs text-[var(--success)] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> Active now
              </div>
            </div>
            <button className="h-8 w-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--slate-100)] flex items-center justify-center"><Icon name="Phone" size={17} /></button>
            <button className="h-8 w-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--slate-100)] flex items-center justify-center"><Icon name="MoreVertical" size={17} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg)]">
            {MESSAGES.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${m.from === "me" ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`px-3.5 py-2 rounded-2xl text-sm ${
                    m.from === "me"
                      ? "bg-[var(--brand-700)] text-white rounded-br-sm"
                      : "bg-white text-[var(--text)] border border-[var(--border)] rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[0.65rem] text-[var(--text-subtle)] mt-1 px-1">{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[var(--border)] flex items-center gap-2">
            <button className="h-9 w-9 rounded-lg text-[var(--text-muted)] hover:bg-[var(--slate-100)] flex items-center justify-center"><Icon name="Paperclip" size={18} /></button>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 input-base py-2.5 text-sm"
            />
            <button className="h-9 w-9 rounded-lg bg-[var(--brand-700)] text-white flex items-center justify-center hover:bg-[var(--brand-800)]">
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
