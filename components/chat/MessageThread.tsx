"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "./Avatar";
import { MessageBubble } from "./MessageBubble";
import {
  dayKey,
  formatDayLabel,
  type ChatAttachment,
  type ChatMessage,
  type Conversation,
} from "@/lib/chat";

/** Scrollable message thread with the conversation header. */
export function MessageThread({
  conversation,
  messages,
  meId,
  loading,
  hasMore,
  loadingMore,
  online,
  typingNames,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onToggleReaction,
  onTogglePin,
  onOpenImage,
  onToggleMute,
  onToggleArchive,
  onOpenGroupInfo,
  onOpenSearch,
  onOpenPinned,
  onBack,
  footer,
}: {
  conversation: Conversation;
  messages: ChatMessage[];
  meId: string | null;
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  online: boolean;
  typingNames: string[];
  onLoadMore: () => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onToggleReaction: (message: ChatMessage, emoji: string) => void;
  onTogglePin: (message: ChatMessage) => void;
  onOpenImage: (attachment: ChatAttachment) => void;
  onToggleMute: () => void;
  onToggleArchive: () => void;
  onOpenGroupInfo: () => void;
  onOpenSearch: () => void;
  onOpenPinned: () => void;
  onBack: () => void;
  footer: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const prevHeightRef = useRef(0);
  const lastConversationRef = useRef<string | null>(null);

  const groups = useMemo(() => {
    const out: { key: string; label: string; messages: ChatMessage[] }[] = [];
    for (const message of messages) {
      const key = dayKey(message.createdAt);
      const last = out[out.length - 1];
      if (last && last.key === key) last.messages.push(message);
      else out.push({ key, label: formatDayLabel(message.createdAt), messages: [message] });
    }
    return out;
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Jump to the newest message whenever a different conversation is opened.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (lastConversationRef.current !== conversation.id) {
      lastConversationRef.current = conversation.id;
      el.scrollTop = el.scrollHeight;
      atBottomRef.current = true;
      return;
    }
    if (prevHeightRef.current > 0) {
      el.scrollTop = el.scrollHeight - prevHeightRef.current;
      prevHeightRef.current = 0;
      return;
    }
    if (atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, conversation.id]);

  function loadMore() {
    const el = scrollRef.current;
    prevHeightRef.current = el ? el.scrollHeight - el.scrollTop : 0;
    onLoadMore();
  }

  const subtitle = conversation.isGroup
    ? `${conversation.memberCount} members`
    : online
      ? "Active now"
      : "Offline";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-[var(--border)] p-3.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] md:hidden"
          aria-label="Back"
        >
          <Icon name="ArrowLeft" size={18} />
        </button>

        <button
          type="button"
          onClick={conversation.isGroup ? onOpenGroupInfo : undefined}
          className={`flex min-w-0 flex-1 items-center gap-3 text-left ${
            conversation.isGroup ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <Avatar
            name={conversation.name}
            avatarUrl={conversation.avatarUrl}
            online={online}
            showPresence={!conversation.isGroup}
            group={conversation.isGroup}
            size={38}
          />
          <div className="min-w-0">
            <div className="truncate font-semibold text-[var(--text)]">{conversation.name}</div>
            <div
              className={`flex items-center gap-1 text-xs ${
                typingNames.length > 0
                  ? "italic text-[var(--brand-600)]"
                  : online && !conversation.isGroup
                    ? "text-[var(--success)]"
                    : "text-[var(--text-muted)]"
              }`}
            >
              {typingNames.length > 0 ? (
                `${typingNames.slice(0, 2).join(", ")} ${typingNames.length === 1 ? "is" : "are"} typing…`
              ) : (
                <>
                  {online && !conversation.isGroup && <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />}
                  {subtitle}
                </>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-0.5">
          <HeaderButton icon="Pin" title="Pinned messages" onClick={onOpenPinned} />
          <HeaderButton icon="Search" title="Search messages" onClick={onOpenSearch} />
          <HeaderButton
            icon={conversation.isMuted ? "BellOff" : "Bell"}
            title={conversation.isMuted ? "Unmute" : "Mute"}
            onClick={onToggleMute}
          />
          <HeaderButton
            icon="Archive"
            title={conversation.isArchived ? "Unarchive" : "Archive"}
            onClick={onToggleArchive}
          />
          {conversation.isGroup && <HeaderButton icon="Info" title="Group info" onClick={onOpenGroupInfo} />}
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[var(--bg)] p-4">
        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[0.75rem] font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            >
              {loadingMore && <Icon name="LoaderCircle" size={13} className="animate-spin" />}
              Load earlier messages
            </button>
          </div>
        )}

        {loading && messages.length === 0 && (
          <div className="flex justify-center py-10 text-[var(--text-subtle)]">
            <Icon name="LoaderCircle" size={18} className="animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="MessageSquare" size={28} className="text-[var(--slate-300)]" />
            <p className="mt-2 text-[0.85rem] text-[var(--text-muted)]">
              No messages yet. Say hello to {conversation.name.split(" ")[0]}.
            </p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.key} className="space-y-3">
            <div className="flex justify-center">
              <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-[0.68rem] font-medium text-[var(--text-subtle)] shadow-[var(--shadow-xs)]">
                {group.label}
              </span>
            </div>
            {group.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                mine={message.senderId === meId}
                isGroup={conversation.isGroup}
                canModerate={conversation.isGroup && conversation.myRole === "ADMIN"}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onForward={onForward}
                onToggleReaction={onToggleReaction}
                onTogglePin={onTogglePin}
                onOpenImage={onOpenImage}
              />
            ))}
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
}

function HeaderButton({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
