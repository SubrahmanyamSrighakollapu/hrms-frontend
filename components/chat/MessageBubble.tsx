"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { AuthedImage } from "./AuthedImage";
import {
  formatClock,
  formatFileSize,
  type ChatAttachment,
  type ChatMessage,
} from "@/lib/chat";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "🙏", "👀"];

/** Read/delivered ticks for the messages I sent. */
function Ticks({ message }: { message: ChatMessage }) {
  const { status } = message;
  if (status.readAll) return <Icon name="CheckCheck" size={14} style={{ color: "var(--brand-600)" }} />;
  if (status.deliveredAll) return <Icon name="CheckCheck" size={14} style={{ color: "var(--text-subtle)" }} />;
  return <Icon name="Check" size={14} style={{ color: "var(--text-subtle)" }} />;
}

function AttachmentView({
  attachment,
  onOpenImage,
}: {
  attachment: ChatAttachment;
  onOpenImage: (attachment: ChatAttachment) => void;
}) {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const { downloadAttachment } = await import("@/lib/chat");
      await downloadAttachment(attachment.url, attachment.originalFilename);
    } finally {
      setDownloading(false);
    }
  }

  if (attachment.mimeType.startsWith("image/")) {
    const preview = attachment.thumbnailUrl ?? attachment.url;
    return (
      <button
        type="button"
        onClick={() => onOpenImage(attachment)}
        className="block overflow-hidden rounded-xl border border-[var(--border)]"
        title={attachment.originalFilename}
      >
        <AuthedImage
          path={preview}
          alt={attachment.originalFilename}
          className="max-h-72 w-full max-w-xs cursor-zoom-in object-cover"
        />
      </button>
    );
  }

  const isVideo = attachment.mimeType.startsWith("video/");
  return (
    <div className="flex min-w-[220px] max-w-xs items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-700)]">
        <Icon name={isVideo ? "Play" : "FileText"} size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.8rem] font-semibold text-[var(--text)]">{attachment.originalFilename}</p>
        <p className="text-[0.7rem] text-[var(--text-subtle)]">
          {isVideo ? "Video" : attachment.fileExtension?.toUpperCase() ?? "File"} ·{" "}
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        title="Download"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
      >
        <Icon name={downloading ? "LoaderCircle" : "Download"} size={15} className={downloading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}

/** A single chat row: bubble, attachments, reactions and hover actions. */
export function MessageBubble({
  message,
  mine,
  isGroup,
  canModerate,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onToggleReaction,
  onTogglePin,
  onOpenImage,
}: {
  message: ChatMessage;
  mine: boolean;
  isGroup: boolean;
  canModerate: boolean;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onToggleReaction: (message: ChatMessage, emoji: string) => void;
  onTogglePin: (message: ChatMessage) => void;
  onOpenImage: (attachment: ChatAttachment) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuOpensDown, setMenuOpensDown] = useState(false);

  if (message.messageType === "SYSTEM") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-[var(--slate-100)] px-3 py-1 text-[0.7rem] text-[var(--text-muted)]">
          {message.content}
        </span>
      </div>
    );
  }

  const hasContent = !!message.content?.trim();
  const canEdit = mine && hasContent;

  return (
    <div className={`group flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
        {isGroup && !mine && message.senderName && (
          <span className="mb-0.5 px-1 text-[0.7rem] font-semibold text-[var(--brand-700)]">
            {message.senderName}
          </span>
        )}

        <div className={`flex items-center gap-1 ${mine ? "flex-row" : "flex-row-reverse"}`}>
          {/* Hover actions */}
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReactions((s) => !s)}
                title="React"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                <Icon name="Smile" size={15} />
              </button>
              {showReactions && (
                <div
                  className={`absolute bottom-8 z-20 flex gap-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-md ${
                    mine ? "right-0" : "left-0"
                  }`}
                >
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onToggleReaction(message, emoji);
                        setShowReactions(false);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-base hover:bg-[var(--surface-2)]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onReply(message)}
              title="Reply"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              <Icon name="Reply" size={15} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  const { top } = event.currentTarget.getBoundingClientRect();
                  setMenuOpensDown(top < window.innerHeight / 2);
                  setShowMenu((s) => !s);
                }}
                title="More"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                <Icon name="MoreVertical" size={15} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                  <div
                    className={`absolute ${menuOpensDown ? "top-8" : "bottom-8"} z-30 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg ${
                      mine ? "right-0" : "left-0"
                    }`}
                  >
                    <MenuButton
                      icon="Forward"
                      label="Forward"
                      onClick={() => {
                        onForward(message);
                        setShowMenu(false);
                      }}
                    />
                    <MenuButton
                      icon="Pin"
                      label={message.pinned ? "Unpin" : "Pin"}
                      onClick={() => {
                        onTogglePin(message);
                        setShowMenu(false);
                      }}
                    />
                    {canEdit && (
                      <MenuButton
                        icon="Pencil"
                        label="Edit"
                        onClick={() => {
                          onEdit(message);
                          setShowMenu(false);
                        }}
                      />
                    )}
                    {(mine || canModerate) && (
                      <MenuButton
                        icon="Trash2"
                        label="Delete"
                        danger
                        onClick={() => {
                          onDelete(message);
                          setShowMenu(false);
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
            <div
              className={`rounded-2xl px-3.5 py-2 text-sm ${
                mine
                  ? "rounded-br-sm bg-[var(--brand-700)] text-white"
                  : "rounded-bl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
              }`}
            >
              {message.replyTo && (
                <div
                  className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-[0.72rem] ${
                    mine
                      ? "border-white/50 bg-white/10 text-white/90"
                      : "border-[var(--brand-400)] bg-[var(--surface-2)] text-[var(--text-muted)]"
                  }`}
                >
                  <div className="font-semibold">{message.replyTo.senderName ?? "Message"}</div>
                  <div className="truncate">
                    {message.replyTo.isDeleted ? "This message was deleted" : message.replyTo.content ?? "Attachment"}
                  </div>
                </div>
              )}

              {message.attachments.length > 0 && (
                <div className="mb-1.5 flex flex-col gap-1.5">
                  {message.attachments.map((attachment) => (
                    <AttachmentView key={attachment.id} attachment={attachment} onOpenImage={onOpenImage} />
                  ))}
                </div>
              )}

              {message.isDeleted ? (
                <span className="italic opacity-70">This message was deleted</span>
              ) : (
                hasContent && <span className="whitespace-pre-wrap break-words">{message.content}</span>
              )}
            </div>

            {message.reactions.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {message.reactions.map((reaction) => (
                  <button
                    key={reaction.reaction}
                    type="button"
                    onClick={() => onToggleReaction(message, reaction.reaction)}
                    className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[0.72rem] transition-colors ${
                      reaction.mine
                        ? "border-[var(--brand-400)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                    }`}
                    title={`${reaction.count} reaction${reaction.count === 1 ? "" : "s"}`}
                  >
                    <span>{reaction.reaction}</span>
                    <span className="font-semibold">{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}

            <div className={`mt-1 flex items-center gap-1 px-1 text-[0.62rem] text-[var(--text-subtle)] ${mine ? "flex-row" : "flex-row-reverse"}`}>
              {message.pinned && <Icon name="Pin" size={11} />}
              {message.forwardedFromMessageId && <Icon name="Forward" size={11} />}
              {message.editedAt && <span>edited</span>}
              <span>{formatClock(message.createdAt)}</span>
              {mine && <Ticks message={message} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[0.8rem] transition-colors hover:bg-[var(--surface-2)] ${
        danger ? "text-[var(--danger)]" : "text-[var(--text)]"
      }`}
    >
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}
