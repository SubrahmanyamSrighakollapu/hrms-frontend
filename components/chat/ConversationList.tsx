"use client";

import { Icon } from "@/components/ui/Icon";
import { Avatar } from "./Avatar";
import { formatListStamp, previewText, type Conversation } from "@/lib/chat";

/** Left rail: search, archived filter and the ordered conversation list. */
export function ConversationList({
  conversations,
  activeId,
  loading,
  query,
  onQueryChange,
  archived,
  onToggleArchived,
  onSelect,
  onNew,
  onOpenSettings,
  isOnline,
  isTyping,
  myId,
}: {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  archived: boolean;
  onToggleArchived: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onOpenSettings: () => void;
  isOnline: (employeeId: string | null | undefined) => boolean;
  isTyping: (conversationId: string) => boolean;
  myId: string | null;
}) {
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? conversations.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          (c.lastMessage?.content ?? "").toLowerCase().includes(needle),
      )
    : conversations;

  return (
    <div className="flex min-h-0 w-full flex-col border-r border-[var(--border)] md:w-[320px] md:flex-shrink-0">
      <div className="border-b border-[var(--border)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-[var(--text)]">Messages</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenSettings}
              title="Chat settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]"
            >
              <Icon name="Settings" size={16} />
            </button>
            <button
              type="button"
              onClick={onNew}
              title="New conversation"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)] transition-colors hover:bg-[var(--brand-100)]"
            >
              <Icon name="MessageSquarePlus" size={16} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Icon
            name="Search"
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search conversations…"
            className="input-base input-base--leading-icon py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onToggleArchived}
          className={`mt-2 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[0.72rem] font-semibold transition-colors ${
            archived
              ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
              : "bg-[var(--slate-100)] text-[var(--slate-600)] hover:bg-[var(--slate-200)]"
          }`}
        >
          <Icon name="Archive" size={13} />
          {archived ? "Archived" : "Active"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-10 text-[var(--text-subtle)]">
            <Icon name="LoaderCircle" size={18} className="animate-spin" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="px-4 py-10 text-center">
            <Icon name="MessageSquare" size={26} className="mx-auto text-[var(--slate-300)]" />
            <p className="mt-2 text-[0.82rem] text-[var(--text-muted)]">
              {archived ? "No archived conversations" : "No conversations yet"}
            </p>
            <p className="mt-0.5 text-[0.75rem] text-[var(--text-subtle)]">
              Start one with the “＋” button above.
            </p>
          </div>
        )}

        {visible.map((conversation) => {
          const online = conversation.isGroup ? false : isOnline(conversation.counterpart?.employeeId);
          const typing = isTyping(conversation.id);
          const active = conversation.id === activeId;
          const preview = typing
            ? "typing…"
            : conversation.lastMessage
              ? `${
                  conversation.lastMessage.senderId && conversation.lastMessage.senderId !== myId
                    ? `${conversation.lastMessage.senderName?.split(" ")[0] ?? ""}: `
                    : ""
                }${previewText(conversation.lastMessage)}`
              : "No messages yet";

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full gap-3 border-b border-[var(--border)] p-3 text-left transition-colors ${
                active ? "bg-[var(--brand-50)]" : "hover:bg-[var(--slate-50)]"
              }`}
            >
              <Avatar
                name={conversation.name}
                avatarUrl={conversation.avatarUrl}
                online={online}
                showPresence={!conversation.isGroup}
                group={conversation.isGroup}
                size={42}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-sm font-semibold text-[var(--text)]">
                    {conversation.name}
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-1 text-[0.68rem] text-[var(--text-subtle)]">
                    {conversation.isMuted && <Icon name="BellOff" size={12} />}
                    {conversation.lastMessage ? formatListStamp(conversation.lastMessage.createdAt) : ""}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-1">
                  <span
                    className={`truncate text-xs ${
                      typing ? "italic text-[var(--brand-600)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {preview}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-1 flex h-4 min-w-4 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-700)] px-1 text-[0.65rem] font-bold text-white">
                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
