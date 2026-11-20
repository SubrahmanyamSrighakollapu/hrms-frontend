"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "./Avatar";
import { AuthedImage } from "./AuthedImage";
import {
  formatClock,
  formatListStamp,
  listPinned,
  searchMessages,
  unpinMessage,
  type ChatAttachment,
  type ChatMessage,
  type ChatSettings,
  type Conversation,
  type SearchResult,
} from "@/lib/chat";

/* ---------------- message search ---------------- */

export function SearchDialog({
  open,
  onClose,
  onOpenResult,
}: {
  open: boolean;
  onClose: () => void;
  onOpenResult: (conversationId: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Search messages" description="Find text across your conversations.">
      <SearchPanel onClose={onClose} onOpenResult={onOpenResult} />
    </Modal>
  );
}

/** Mounted only while the dialog is open, so its state starts fresh each time. */
function SearchPanel({
  onClose,
  onOpenResult,
}: {
  onClose: () => void;
  onOpenResult: (conversationId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const text = query.trim();

  useEffect(() => {
    if (text.length < 2) return;
    let active = true;
    const handle = window.setTimeout(() => {
      setLoading(true);
      searchMessages(text)
        .then((list) => {
          if (active) setResults(list);
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [text]);

  return (
    <>
      <div className="relative mb-3">
        <Icon
          name="Search"
          size={15}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages…"
          className="input-base input-base--leading-icon py-2 text-sm"
        />
      </div>

      <div className="max-h-80 space-y-1 overflow-y-auto">
        {loading && text.length >= 2 && (
          <div className="flex justify-center py-6 text-[var(--text-subtle)]">
            <Icon name="LoaderCircle" size={18} className="animate-spin" />
          </div>
        )}
        {!loading && text.length >= 2 && results.length === 0 && (
          <p className="py-6 text-center text-[0.8rem] text-[var(--text-muted)]">No matches found</p>
        )}
        {text.length >= 2 &&
          results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                onOpenResult(result.conversationId);
                onClose();
              }}
              className="flex w-full flex-col gap-0.5 rounded-lg p-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[0.8rem] font-semibold text-[var(--text)]">
                  {result.conversationName}
                  {result.senderName && !result.isGroup ? "" : result.senderName ? ` · ${result.senderName}` : ""}
                </span>
                <span className="flex-shrink-0 text-[0.68rem] text-[var(--text-subtle)]">
                  {formatListStamp(result.createdAt)}
                </span>
              </div>
              <span className="truncate text-[0.78rem] text-[var(--text-muted)]">{result.content ?? "Attachment"}</span>
            </button>
          ))}
      </div>
    </>
  );
}

/* ---------------- pinned messages ---------------- */

export function PinnedDialog({
  open,
  conversationId,
  onClose,
  onOpenMessage,
}: {
  open: boolean;
  conversationId: string | null;
  onClose: () => void;
  onOpenMessage: (messageId: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Pinned messages" description="Quick access to saved messages.">
      {conversationId && (
        <PinnedPanel
          key={conversationId}
          conversationId={conversationId}
          onClose={onClose}
          onOpenMessage={onOpenMessage}
        />
      )}
    </Modal>
  );
}

/** Mounted only while the dialog is open, so its state starts fresh each time. */
function PinnedPanel({
  conversationId,
  onClose,
  onOpenMessage,
}: {
  conversationId: string;
  onClose: () => void;
  onOpenMessage: (messageId: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPinned(conversationId)
      .then((list) => {
        if (active) setMessages(list);
      })
      .catch(() => {
        if (active) setMessages([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [conversationId]);

  async function unpin(messageId: string) {
    setMessages((current) => current.filter((m) => m.id !== messageId));
    try {
      await unpinMessage(conversationId, messageId);
    } catch {
      /* optimistic — a failure simply reappears on next open */
    }
  }

  return (
    <div className="max-h-80 space-y-1 overflow-y-auto">
      {loading && (
        <div className="flex justify-center py-6 text-[var(--text-subtle)]">
          <Icon name="LoaderCircle" size={18} className="animate-spin" />
        </div>
      )}
      {!loading && messages.length === 0 && (
        <p className="py-6 text-center text-[0.8rem] text-[var(--text-muted)]">Nothing pinned yet</p>
      )}
      {messages.map((message) => (
        <div key={message.id} className="flex items-start gap-2 rounded-lg p-2.5 hover:bg-[var(--surface-2)]">
          <button
            type="button"
            onClick={() => {
              onOpenMessage(message.id);
              onClose();
            }}
            className="min-w-0 flex-1 text-left"
          >
            <div className="text-[0.75rem] font-semibold text-[var(--brand-700)]">
              {message.senderName ?? "Message"} · {formatClock(message.createdAt)}
            </div>
            <div className="truncate text-[0.8rem] text-[var(--text)]">
              {message.isDeleted ? "This message was deleted" : message.content ?? "Attachment"}
            </div>
          </button>
          <button
            type="button"
            onClick={() => unpin(message.id)}
            title="Unpin"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            <Icon name="PinOff" size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- forward target ---------------- */

export function ForwardDialog({
  open,
  conversations,
  onClose,
  onForward,
}: {
  open: boolean;
  conversations: Conversation[];
  onClose: () => void;
  onForward: (conversationId: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Forward message" description="Pick a conversation to forward to.">
      <div className="max-h-80 space-y-0.5 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="py-6 text-center text-[0.8rem] text-[var(--text-muted)]">No conversations to forward to</p>
        )}
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => {
              onForward(conversation.id);
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-[var(--surface-2)]"
          >
            <Avatar
              name={conversation.name}
              avatarUrl={conversation.avatarUrl}
              group={conversation.isGroup}
              size={34}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.84rem] font-semibold text-[var(--text)]">{conversation.name}</div>
              <div className="truncate text-[0.72rem] text-[var(--text-muted)]">
                {conversation.isGroup ? `${conversation.memberCount} members` : "Direct message"}
              </div>
            </div>
            <Icon name="Forward" size={15} className="flex-shrink-0 text-[var(--text-subtle)]" />
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ---------------- notification settings ---------------- */

export function SettingsDialog({
  open,
  settings,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  settings: ChatSettings;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<ChatSettings>) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Chat settings" description="Control how you are notified.">
      <div className="space-y-1">
        <SettingToggle
          icon="Bell"
          label="Notifications"
          description="Show a toast when a new message arrives"
          checked={settings.notificationEnabled}
          disabled={saving}
          onChange={(value) => onSave({ notificationEnabled: value })}
        />
        <SettingToggle
          icon="Volume2"
          label="Sound"
          description="Play a short tone for incoming messages"
          checked={settings.soundEnabled}
          disabled={saving}
          onChange={(value) => onSave({ soundEnabled: value })}
        />
      </div>
    </Modal>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)]">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.85rem] font-semibold text-[var(--text)]">{label}</span>
        <span className="block text-[0.75rem] text-[var(--text-muted)]">{description}</span>
      </span>
      <span
        className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--brand-600)]" : "bg-[var(--slate-300)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.15rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/* ---------------- image lightbox ---------------- */

export function Lightbox({
  attachment,
  onClose,
}: {
  attachment: ChatAttachment | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!attachment) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [attachment, onClose]);

  if (!attachment) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/80 overlay-in" onClick={onClose} />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <Icon name="X" size={18} />
      </button>
      <AuthedImage
        path={attachment.url}
        alt={attachment.originalFilename}
        className="fade-in relative max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
      />
    </div>
  );
}
