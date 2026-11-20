"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatFileSize, type ChatMessage } from "@/lib/chat";

const EMOJIS = ["😀", "😄", "😉", "😍", "👍", "🙏", "🎉", "🔥", "✅", "❌", "❤️", "😂", "👀", "🙌", "💡", "⏰"];

/** Message composer with reply/edit banners, emoji picker and attachments. */
export function Composer({
  value,
  onChange,
  onSend,
  onUpload,
  sending,
  replyingTo,
  editing,
  onCancelContext,
  onTyping,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onUpload: (file: File) => void;
  sending: boolean;
  replyingTo: ChatMessage | null;
  editing: ChatMessage | null;
  onCancelContext: () => void;
  onTyping: (isTyping: boolean) => void;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);
  const typingTimer = useRef<number | null>(null);

  // Auto-grow the textarea up to a cap.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [value]);

  useEffect(() => {
    if (editing || replyingTo) textareaRef.current?.focus();
  }, [editing, replyingTo]);

  function stopTyping() {
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = null;
    if (typingRef.current) {
      typingRef.current = false;
      onTyping(false);
    }
  }

  function handleChange(next: string) {
    onChange(next);
    if (!typingRef.current) {
      typingRef.current = true;
      onTyping(true);
    }
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(stopTyping, 1800);
  }

  function submit() {
    stopTyping();
    onSend();
  }

  function pickFile(accept: string, input: HTMLInputElement | null) {
    if (input) {
      input.value = "";
      input.click();
    }
  }

  const banner = editing
    ? { label: "Editing message", text: editing.content ?? "" }
    : replyingTo
      ? { label: `Replying to ${replyingTo.senderName ?? "message"}`, text: replyingTo.content ?? "Attachment" }
      : null;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3">
      {banner && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-[var(--brand-500)] bg-[var(--surface-2)] px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <div className="text-[0.7rem] font-semibold text-[var(--brand-700)]">{banner.label}</div>
            <div className="truncate text-[0.75rem] text-[var(--text-muted)]">{banner.text}</div>
          </div>
          <button
            type="button"
            onClick={onCancelContext}
            aria-label="Cancel"
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-[var(--surface)]"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
          <Icon name="Paperclip" size={15} className="text-[var(--text-muted)]" />
          <span className="min-w-0 flex-1 truncate text-[0.78rem] text-[var(--text)]">{pendingFile.name}</span>
          <span className="text-[0.7rem] text-[var(--text-subtle)]">{formatFileSize(pendingFile.size)}</span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            aria-label="Remove attachment"
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-subtle)] hover:bg-[var(--surface)]"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2">
        <div className="flex items-center gap-0.5">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPendingFile(file);
            }}
          />
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPendingFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => pickFile("*/*", fileRef.current)}
            title="Attach a file"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          >
            <Icon name="Paperclip" size={18} />
          </button>
          <button
            type="button"
            onClick={() => pickFile("image/*", imageRef.current)}
            title="Attach an image"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          >
            <Icon name="Image" size={18} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Type a message…"
          className="input-base max-h-[150px] min-h-[40px] flex-1 resize-none py-2.5 text-sm"
        />

        <button
          type="button"
          onClick={() => setShowEmoji((s) => !s)}
          title="Emoji"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
        >
          <Icon name="Smile" size={18} />
        </button>

        {showEmoji && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowEmoji(false)} />
            <div className="absolute bottom-12 right-12 z-30 grid w-56 grid-cols-8 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(value + emoji);
                    setShowEmoji(false);
                    textareaRef.current?.focus();
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-lg hover:bg-[var(--surface-2)]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={sending || (!value.trim() && !pendingFile)}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-700)] text-white transition-colors hover:bg-[var(--brand-800)] disabled:opacity-40"
          title="Send"
        >
          <Icon name={sending ? "LoaderCircle" : "Send"} size={16} className={sending ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Attachment send is a two-step action so the user can add a caption. */}
      {pendingFile && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={sending}
            onClick={() => {
              const file = pendingFile;
              setPendingFile(null);
              onUpload(file);
            }}
            className="btn-primary inline-flex h-8 items-center gap-1.5 px-3 text-[0.8rem] disabled:opacity-40"
          >
            <Icon name="Upload" size={15} />
            Send attachment
          </button>
        </div>
      )}
    </div>
  );
}
