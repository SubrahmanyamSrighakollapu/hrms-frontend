"use client";

import { api, API_URL, getAccessToken } from "@/lib/api";

/* =========================================================
   Chat — data layer
   ---------------------------------------------------------
   Thin client over the `/chat` REST API plus the helpers the
   socket layer needs (socket URL/factory) and the authenticated
   blob loader used for avatars and attachments.

   Attachments and group avatars are served behind a membership
   check, so a plain `<img src>` cannot reach them (no Bearer
   token). Everything is fetched as a blob and turned into an
   object URL instead.
   ========================================================= */

export type ConversationType = "DIRECT" | "GROUP";
export type MemberRole = "MEMBER" | "ADMIN";
export type ChatMessageType = "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "SYSTEM";
export type PresenceStatus = "ONLINE" | "OFFLINE";

export interface ChatEmployee {
  id: string;
  name: string;
  email: string;
  employeeCode: string | null;
  designation: string | null;
  department: string | null;
  avatarUrl: string | null;
  online: boolean;
  lastSeenAt: string | null;
}

export interface ConversationMember {
  employeeId: string;
  name: string;
  email: string;
  employeeCode: string | null;
  designation: string | null;
  department: string | null;
  avatarUrl: string | null;
  role: MemberRole;
  online: boolean;
  lastSeenAt: string | null;
}

export interface ChatAttachment {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileExtension: string | null;
  fileSize: number;
  category: string | null;
  width: number | null;
  height: number | null;
  hasThumbnail: boolean;
  /** Authenticated download path (includes the API prefix); needs a Bearer token. */
  url: string;
  thumbnailUrl: string | null;
}

export interface ReactionSummary {
  reaction: string;
  count: number;
  mine: boolean;
  employeeIds: string[];
}

export interface MessageStatus {
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  deliveredAll: boolean;
  readAll: boolean;
  myDeliveredAt: string | null;
  myReadAt: string | null;
}

export interface MessagePreview {
  id: string;
  senderId: string | null;
  senderName: string | null;
  messageType: ChatMessageType;
  content: string | null;
  isDeleted: boolean;
  createdAt: string;
  hasAttachment: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  senderDesignation: string | null;
  messageType: ChatMessageType;
  content: string | null;
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
  clientMessageId: string | null;
  replyTo: MessagePreview | null;
  forwardedFromMessageId: string | null;
  attachments: ChatAttachment[];
  reactions: ReactionSummary[];
  pinned: boolean;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  createdById: string | null;
  description: string | null;
  avatarUrl: string | null;
  isGroup: boolean;
  memberCount: number;
  members: ConversationMember[];
  counterpart: ConversationMember | null;
  lastMessage: MessagePreview | null;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  myRole: MemberRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessagePage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ChatSettings {
  notificationEnabled: boolean;
  soundEnabled: boolean;
}

export interface PresenceUpdate {
  employeeId: string;
  status: PresenceStatus;
  online: boolean;
  lastSeenAt: string | null;
}

export interface SearchResult {
  id: string;
  conversationId: string;
  conversationName: string;
  isGroup: boolean;
  senderId: string | null;
  senderName: string | null;
  content: string | null;
  createdAt: string;
}

/** Emitted on `conversation:updated`; the shape varies with what changed. */
export interface ConversationUpdatedPayload {
  conversationId: string;
  conversation?: Conversation;
  lastMessage?: MessagePreview;
  updatedAt?: string;
  removed?: true;
}

export interface TypingPayload {
  conversationId: string;
  employeeId: string;
}

export interface ReceiptPayload {
  conversationId: string;
  employeeId: string;
  messageId?: string;
  deliveredAt?: string;
  readAt?: string;
}

/* ---------------- helpers ---------------- */

const ORIGIN = new URL(API_URL).origin;

/** Turn an API-relative path (with the `/api/v1` prefix) into an absolute URL. */
export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${ORIGIN}${path}`;
}

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const blobCache = new Map<string, Promise<string>>();

/**
 * Fetch a protected file and cache its object URL for the tab's lifetime.
 * Failures are evicted so a later retry can succeed.
 */
export function loadAuthedBlobUrl(path: string): Promise<string> {
  const cached = blobCache.get(path);
  if (cached) return cached;

  const promise = (async () => {
    const res = await fetch(absoluteUrl(path), { headers: authHeader() });
    if (!res.ok) throw new Error(`Failed to load file (${res.status})`);
    return URL.createObjectURL(await res.blob());
  })();

  blobCache.set(path, promise);
  promise.catch(() => blobCache.delete(path));
  return promise;
}

/** Fetch a protected file and trigger a browser download. */
export async function downloadAttachment(path: string, filename: string): Promise<void> {
  const res = await fetch(absoluteUrl(path), { headers: authHeader() });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const href = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

/* ---------------- formatting ---------------- */

/** "09:41" — the time shown under a chat bubble. */
export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Compact stamp for the conversation list: time today, "Yesterday", else date. */
export function formatListStamp(iso: string): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return formatClock(iso);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

/** "Today" / "Yesterday" / "15 Nov 2026" — used for the day separators. */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/** "1.2 MB", "840 B" — attachment sizes. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** "Priya Nair": first two initials for the fallback avatar. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** One-line preview of a message for the conversation list. */
export function previewText(preview: MessagePreview | null): string {
  if (!preview) return "No messages yet";
  if (preview.isDeleted) return "This message was deleted";
  if (preview.messageType === "IMAGE") return preview.content?.trim() || "Photo";
  if (preview.messageType === "VIDEO") return preview.content?.trim() || "Video";
  if (preview.messageType === "FILE") return preview.content?.trim() || "Attachment";
  return preview.content ?? "";
}

/* ---------------- REST API ---------------- */

export function listDirectory(q?: string): Promise<ChatEmployee[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return api.get<{ employees: ChatEmployee[] }>(`/chat/directory${query}`).then((r) => r.employees);
}

export function listConversations(archived = false): Promise<Conversation[]> {
  return api
    .get<{ conversations: Conversation[] }>(`/chat/conversations?archived=${archived}`)
    .then((r) => r.conversations);
}

export function getConversation(id: string): Promise<Conversation> {
  return api.get<{ conversation: Conversation }>(`/chat/conversations/${id}`).then((r) => r.conversation);
}

export function createDirect(employeeId: string): Promise<Conversation> {
  return api.post<{ conversation: Conversation }>("/chat/conversations/direct", { employeeId }).then((r) => r.conversation);
}

export interface CreateGroupInput {
  name: string;
  description?: string | null;
  memberIds: string[];
}

export function createGroup(input: CreateGroupInput): Promise<Conversation> {
  return api.post<{ conversation: Conversation }>("/chat/conversations/group", input).then((r) => r.conversation);
}

export function updateGroup(
  id: string,
  input: { name?: string; description?: string | null },
): Promise<Conversation> {
  return api.patch<{ conversation: Conversation }>(`/chat/conversations/${id}`, input).then((r) => r.conversation);
}

export function addMembers(id: string, memberIds: string[]): Promise<Conversation> {
  return api.post<{ conversation: Conversation }>(`/chat/conversations/${id}/members`, { memberIds }).then((r) => r.conversation);
}

export function removeMember(id: string, employeeId: string): Promise<Conversation> {
  return api
    .del<{ conversation: Conversation }>(`/chat/conversations/${id}/members/${employeeId}`)
    .then((r) => r.conversation);
}

export function updateMemberRole(
  id: string,
  employeeId: string,
  role: MemberRole,
): Promise<Conversation> {
  return api
    .patch<{ conversation: Conversation }>(`/chat/conversations/${id}/members/${employeeId}/role`, { role })
    .then((r) => r.conversation);
}

export function leaveGroup(id: string): Promise<void> {
  return api.post<{ left: boolean }>(`/chat/conversations/${id}/leave`).then(() => undefined);
}

export function updateMemberSettings(
  id: string,
  input: { isMuted?: boolean; isArchived?: boolean },
): Promise<Conversation> {
  return api.patch<{ conversation: Conversation }>(`/chat/conversations/${id}/member`, input).then((r) => r.conversation);
}

export function uploadGroupAvatar(id: string, file: File): Promise<Conversation> {
  const form = new FormData();
  form.append("file", file);
  return api.upload<{ conversation: Conversation }>(`/chat/conversations/${id}/avatar`, form).then((r) => r.conversation);
}

export function listMessages(
  conversationId: string,
  params: { before?: string; limit?: number } = {},
): Promise<MessagePage> {
  const search = new URLSearchParams();
  if (params.before) search.set("before", params.before);
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return api.get<MessagePage>(`/chat/conversations/${conversationId}/messages${query ? `?${query}` : ""}`);
}

export interface SendMessageInput {
  content: string;
  clientMessageId?: string | null;
  replyToMessageId?: string | null;
}

export function sendMessage(conversationId: string, input: SendMessageInput): Promise<ChatMessage> {
  return api.post<{ message: ChatMessage }>(`/chat/conversations/${conversationId}/messages`, input).then((r) => r.message);
}

export function sendAttachment(
  conversationId: string,
  file: File,
  input: { content?: string; clientMessageId?: string | null; replyToMessageId?: string | null } = {},
): Promise<ChatMessage> {
  const form = new FormData();
  form.append("file", file);
  if (input.content) form.append("content", input.content);
  if (input.clientMessageId) form.append("clientMessageId", input.clientMessageId);
  if (input.replyToMessageId) form.append("replyToMessageId", input.replyToMessageId);
  return api.upload<{ message: ChatMessage }>(`/chat/conversations/${conversationId}/attachments`, form).then((r) => r.message);
}

export function editMessage(messageId: string, content: string): Promise<ChatMessage> {
  return api.patch<{ message: ChatMessage }>(`/chat/messages/${messageId}`, { content }).then((r) => r.message);
}

export function deleteMessage(messageId: string): Promise<void> {
  return api.del<{ deleted: boolean }>(`/chat/messages/${messageId}`).then(() => undefined);
}

export function forwardMessage(messageId: string, conversationId: string): Promise<ChatMessage> {
  return api.post<{ message: ChatMessage }>(`/chat/messages/${messageId}/forward`, { conversationId }).then((r) => r.message);
}

export function addReaction(messageId: string, reaction: string): Promise<ChatMessage> {
  return api.post<{ message: ChatMessage }>(`/chat/messages/${messageId}/reactions`, { reaction }).then((r) => r.message);
}

export function removeReaction(messageId: string, reaction: string): Promise<ChatMessage> {
  return api
    .del<{ message: ChatMessage }>(`/chat/messages/${messageId}/reactions/${encodeURIComponent(reaction)}`)
    .then((r) => r.message);
}

export function markDelivered(conversationId: string): Promise<{ updated: number }> {
  return api.post<{ updated: number }>(`/chat/conversations/${conversationId}/delivered`);
}

export function markRead(conversationId: string, messageId: string): Promise<void> {
  return api.post<{ read: boolean }>(`/chat/conversations/${conversationId}/read`, { messageId }).then(() => undefined);
}

export function listPinned(conversationId: string): Promise<ChatMessage[]> {
  return api.get<{ messages: ChatMessage[] }>(`/chat/conversations/${conversationId}/pinned`).then((r) => r.messages);
}

export function pinMessage(conversationId: string, messageId: string): Promise<ChatMessage> {
  return api.post<{ message: ChatMessage }>(`/chat/conversations/${conversationId}/pin`, { messageId }).then((r) => r.message);
}

export function unpinMessage(conversationId: string, messageId: string): Promise<void> {
  return api
    .del<{ unpinned: boolean }>(`/chat/conversations/${conversationId}/pin/${messageId}`)
    .then(() => undefined);
}

export function searchMessages(q: string, limit = 20): Promise<SearchResult[]> {
  const search = new URLSearchParams({ q, limit: String(limit) });
  return api.get<{ results: SearchResult[] }>(`/chat/search?${search.toString()}`).then((r) => r.results);
}

export function getSettings(): Promise<ChatSettings> {
  return api.get<{ settings: ChatSettings }>("/chat/settings").then((r) => r.settings);
}

export function updateSettings(input: Partial<ChatSettings>): Promise<ChatSettings> {
  return api.patch<{ settings: ChatSettings }>("/chat/settings", input).then((r) => r.settings);
}

export function getUnreadSummary(): Promise<{ total: number; conversations: { conversationId: string; count: number }[] }> {
  return api.get<{ total: number; conversations: { conversationId: string; count: number }[] }>("/chat/unread");
}

/* ---------------- socket ---------------- */

/** Origin the Socket.IO server is mounted on (the API origin, no path prefix). */
export function chatSocketUrl(): string {
  return ORIGIN;
}
