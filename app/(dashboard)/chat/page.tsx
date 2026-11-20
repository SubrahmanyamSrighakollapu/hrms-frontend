"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { ChatSocketProvider, useChatSocket } from "@/lib/chat-socket";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageThread } from "@/components/chat/MessageThread";
import { Composer } from "@/components/chat/Composer";
import { NewConversationDialog } from "@/components/chat/NewConversationDialog";
import { GroupInfoDrawer } from "@/components/chat/GroupInfoDrawer";
import {
  ForwardDialog,
  Lightbox,
  PinnedDialog,
  SearchDialog,
  SettingsDialog,
} from "@/components/chat/ChatDialogs";
import {
  addReaction,
  deleteMessage,
  editMessage,
  forwardMessage,
  getSettings,
  listConversations,
  listMessages,
  markDelivered,
  markRead,
  pinMessage,
  previewText,
  removeReaction,
  sendAttachment,
  sendMessage,
  unpinMessage,
  updateMemberSettings,
  updateSettings,
  type ChatAttachment,
  type ChatMessage,
  type ChatSettings,
  type Conversation,
  type ConversationUpdatedPayload,
  type MessagePreview,
  type PresenceUpdate,
  type ReceiptPayload,
  type TypingPayload,
} from "@/lib/chat";

/** How long a typing indicator lingers if the "stop" event is lost. */
const TYPING_TIMEOUT = 4000;
const PAGE_SIZE = 30;

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

/** Insert or replace a message, matching on id then on clientMessageId. */
function mergeMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const index = list.findIndex(
    (item) => item.id === message.id || (!!message.clientMessageId && item.clientMessageId === message.clientMessageId),
  );
  if (index < 0) return [...list, message];
  const next = [...list];
  next[index] = message;
  return next;
}

/** Short tone for incoming messages when the sound setting is on. */
function playPing(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 720;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => void ctx.close();
  } catch {
    /* audio is best-effort */
  }
}

export default function ChatPage() {
  return (
    <ChatSocketProvider>
      <ChatWorkspace />
    </ChatSocketProvider>
  );
}

function ChatWorkspace() {
  const { user } = useAuth();
  const meId = user?.id ?? null;
  const { socket } = useChatSocket();
  const toast = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);

  const [presences, setPresences] = useState<Record<string, boolean>>({});
  const [typingMap, setTypingMap] = useState<Record<string, Record<string, true>>>({});
  const [settings, setSettings] = useState<ChatSettings>({ notificationEnabled: true, soundEnabled: true });
  const [savingSettings, setSavingSettings] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<ChatMessage | null>(null);
  const [lightbox, setLightbox] = useState<ChatAttachment | null>(null);
  const [pane, setPane] = useState<"list" | "thread">("list");

  const activeIdRef = useRef<string | null>(null);
  const socketRef = useRef(socket);
  const settingsRef = useRef(settings);
  const conversationsRef = useRef<Conversation[]>([]);
  const refreshRef = useRef<() => void>(() => {});
  const typingTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  /* ---------------- data loading ---------------- */

  const seedPresence = useCallback((list: Conversation[]) => {
    setPresences((prev) => {
      const next = { ...prev };
      for (const conversation of list) {
        if (conversation.counterpart) next[conversation.counterpart.employeeId] = conversation.counterpart.online;
        for (const member of conversation.members) next[member.employeeId] = member.online;
      }
      return next;
    });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const list = await listConversations(archived);
      setConversations(list);
      seedPresence(list);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setLoadingConversations(false);
    }
  }, [archived, seedPresence, toast]);

  useEffect(() => {
    let active = true;
    listConversations(archived)
      .then((list) => {
        if (!active) return;
        setConversations(list);
        seedPresence(list);
      })
      .catch((error) => {
        if (active) toast.error(errorText(error));
      })
      .finally(() => {
        if (active) setLoadingConversations(false);
      });
    return () => {
      active = false;
    };
  }, [archived, seedPresence, toast]);

  useEffect(() => {
    refreshRef.current = () => void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {
        /* keep the defaults */
      });
  }, []);

  /** Clear the unread badge and tell the server we delivered/read the thread. */
  const acknowledge = useCallback((conversationId: string, messageId: string) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
    const client = socketRef.current;
    if (client?.connected) {
      client.emit("message:delivered", { conversationId });
      client.emit("message:read", { conversationId, messageId });
    } else {
      markDelivered(conversationId).catch(() => {});
      markRead(conversationId, messageId).catch(() => {});
    }
  }, []);

  const openConversation = useCallback(
    (id: string) => {
      const previous = activeIdRef.current;
      if (previous === id) {
        setPane("thread");
        return;
      }
      if (previous && previous !== id) {
        socketRef.current?.emit("typing:stop", { conversationId: previous });
      }
      setActiveId(id);
      activeIdRef.current = id;
      setPane("thread");
      setLoadingMessages(true);
      setReplyingTo(null);
      setEditing(null);
      setText("");
      setMessages([]);
      setCursor(null);
      setHasMore(false);
      setGroupInfoOpen(false);
      socketRef.current?.emit("chat:join", { conversationId: id });
    },
    [],
  );

  // Load the newest page whenever the open conversation changes.
  useEffect(() => {
    if (!activeId) return;
    let active = true;
    listMessages(activeId, { limit: PAGE_SIZE })
      .then((page) => {
        if (!active) return;
        setMessages(page.messages);
        setHasMore(page.hasMore);
        setCursor(page.nextCursor);
        const last = page.messages[page.messages.length - 1];
        if (last) acknowledge(activeId, last.id);
      })
      .catch((error) => {
        if (active) toast.error(errorText(error));
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });
    return () => {
      active = false;
    };
  }, [activeId, acknowledge, toast]);

  const loadMore = useCallback(async () => {
    if (!activeId || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listMessages(activeId, { before: cursor, limit: PAGE_SIZE });
      setMessages((prev) => [...page.messages, ...prev]);
      setHasMore(page.hasMore);
      setCursor(page.nextCursor);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setLoadingMore(false);
    }
  }, [activeId, cursor, loadingMore, toast]);

  /* ---------------- realtime ---------------- */

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (message: ChatMessage) => {
      if (message.conversationId === activeIdRef.current) {
        setMessages((prev) => mergeMessage(prev, message));
        acknowledge(message.conversationId, message.id);
      } else if (message.senderId !== meId) {
        setConversations((prev) =>
          prev.map((c) => (c.id === message.conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c)),
        );
      }
    };

    const onUpdatedMessage = (message: ChatMessage) => {
      if (message.conversationId !== activeIdRef.current) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };

    const onDeletedMessage = (payload: { id: string; conversationId: string }) => {
      if (payload.conversationId !== activeIdRef.current) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, isDeleted: true, content: null } : m)),
      );
    };

    const onDelivered = (payload: ReceiptPayload) => {
      if (payload.employeeId === meId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === meId && m.conversationId === payload.conversationId
            ? { ...m, status: { ...m.status, deliveredCount: m.status.recipientCount, deliveredAll: true } }
            : m,
        ),
      );
    };

    const onRead = (payload: ReceiptPayload) => {
      if (payload.employeeId === meId) return;
      setMessages((prev) => {
        const targetIndex = payload.messageId ? prev.findIndex((m) => m.id === payload.messageId) : -1;
        return prev.map((m, index) => {
          if (m.senderId !== meId || m.conversationId !== payload.conversationId) return m;
          if (targetIndex >= 0 && index > targetIndex) return m;
          return {
            ...m,
            status: { ...m.status, readAll: true, deliveredAll: true, readCount: m.status.recipientCount },
          };
        });
      });
    };

    const onConversationUpdated = (payload: ConversationUpdatedPayload) => {
      if (payload.removed) {
        setConversations((prev) => prev.filter((c) => c.id !== payload.conversationId));
        if (activeIdRef.current === payload.conversationId) {
          setActiveId(null);
          activeIdRef.current = null;
          setMessages([]);
          setGroupInfoOpen(false);
        }
        return;
      }

      if (payload.conversation) {
        const updated = payload.conversation;
        setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        seedPresence([updated]);
        return;
      }

      if (payload.lastMessage) {
        const preview = payload.lastMessage;
        if (!conversationsRef.current.some((c) => c.id === payload.conversationId)) {
          refreshRef.current();
          return;
        }
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === payload.conversationId);
          if (index < 0) return prev;
          const next = [...prev];
          const conversation = { ...next[index], lastMessage: preview };
          next.splice(index, 1);
          return [conversation, ...next];
        });
      }
    };

    const onTypingStarted = (payload: TypingPayload) => {
      if (payload.employeeId === meId) return;
      const key = `${payload.conversationId}:${payload.employeeId}`;
      setTypingMap((prev) => ({
        ...prev,
        [payload.conversationId]: { ...(prev[payload.conversationId] ?? {}), [payload.employeeId]: true },
      }));
      if (typingTimers.current[key]) window.clearTimeout(typingTimers.current[key]);
      typingTimers.current[key] = window.setTimeout(() => {
        delete typingTimers.current[key];
        setTypingMap((prev) => {
          const conversation = { ...(prev[payload.conversationId] ?? {}) };
          delete conversation[payload.employeeId];
          return { ...prev, [payload.conversationId]: conversation };
        });
      }, TYPING_TIMEOUT);
    };

    const onTypingStopped = (payload: TypingPayload) => {
      const key = `${payload.conversationId}:${payload.employeeId}`;
      if (typingTimers.current[key]) {
        window.clearTimeout(typingTimers.current[key]);
        delete typingTimers.current[key];
      }
      setTypingMap((prev) => {
        const conversation = { ...(prev[payload.conversationId] ?? {}) };
        delete conversation[payload.employeeId];
        return { ...prev, [payload.conversationId]: conversation };
      });
    };

    const onPresence = (payload: PresenceUpdate) => {
      if (!payload.employeeId) return;
      setPresences((prev) => ({ ...prev, [payload.employeeId]: payload.online }));
    };

    const onNotification = (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.message.senderId === meId) return;
      const current = settingsRef.current;
      if (!current.notificationEnabled) return;
      if (payload.conversationId === activeIdRef.current && document.visibilityState === "visible") return;
      const message = payload.message;
      const preview: MessagePreview = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        messageType: message.messageType,
        content: message.content,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
        hasAttachment: message.attachments.length > 0,
      };
      toast.toast(`${message.senderName ?? "New message"}: ${previewText(preview)}`, "info");
      if (current.soundEnabled) playPing();
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:updated", onUpdatedMessage);
    socket.on("message:deleted", onDeletedMessage);
    socket.on("message:delivered", onDelivered);
    socket.on("message:read", onRead);
    socket.on("conversation:updated", onConversationUpdated);
    socket.on("typing:started", onTypingStarted);
    socket.on("typing:stopped", onTypingStopped);
    socket.on("user:online", onPresence);
    socket.on("user:offline", onPresence);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:updated", onUpdatedMessage);
      socket.off("message:deleted", onDeletedMessage);
      socket.off("message:delivered", onDelivered);
      socket.off("message:read", onRead);
      socket.off("conversation:updated", onConversationUpdated);
      socket.off("typing:started", onTypingStarted);
      socket.off("typing:stopped", onTypingStopped);
      socket.off("user:online", onPresence);
      socket.off("user:offline", onPresence);
      socket.off("notification:new", onNotification);
    };
  }, [socket, meId, acknowledge, seedPresence, toast]);

  /* ---------------- actions ---------------- */

  const emitAck = useCallback(
    <T,>(event: string, payload: unknown): Promise<T | null> =>
      new Promise((resolve) => {
        const client = socketRef.current;
        if (!client?.connected) {
          resolve(null);
          return;
        }
        let settled = false;
        const timer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve(null);
        }, 8000);
        client.emit(event, payload, (response: { ok?: boolean; message?: T; error?: string }) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          if (response?.ok) {
            resolve((response.message as T) ?? null);
          } else {
            if (response?.error) toast.error(response.error);
            resolve(null);
          }
        });
      }),
    [toast],
  );

  const handleSend = useCallback(async () => {
    if (!activeId) return;
    const content = text.trim();

    if (editing) {
      if (!content || content === editing.content) {
        setEditing(null);
        setText("");
        return;
      }
      setSending(true);
      try {
        const updated = await editMessage(editing.id, content);
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditing(null);
        setText("");
      } catch (error) {
        toast.error(errorText(error));
      } finally {
        setSending(false);
      }
      return;
    }

    if (!content) return;
    setSending(true);
    const replyToMessageId = replyingTo?.id ?? null;
    const clientMessageId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const viaSocket = !!socketRef.current?.connected;
    try {
      if (viaSocket) {
        const sent = await emitAck<ChatMessage>("message:send", {
          conversationId: activeId,
          content,
          clientMessageId,
          replyToMessageId,
        });
        if (sent) setMessages((prev) => mergeMessage(prev, sent));
      } else {
        const sent = await sendMessage(activeId, { content, clientMessageId, replyToMessageId });
        setMessages((prev) => mergeMessage(prev, sent));
      }
      setText("");
      setReplyingTo(null);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setSending(false);
    }
  }, [activeId, editing, text, replyingTo, emitAck, toast]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!activeId) return;
      setSending(true);
      try {
        const message = await sendAttachment(activeId, file, {
          content: text.trim() || undefined,
          replyToMessageId: replyingTo?.id ?? null,
        });
        setMessages((prev) => mergeMessage(prev, message));
        setText("");
        setReplyingTo(null);
      } catch (error) {
        toast.error(errorText(error));
      } finally {
        setSending(false);
      }
    },
    [activeId, text, replyingTo, toast],
  );

  const toggleReaction = useCallback(
    async (message: ChatMessage, emoji: string) => {
      const existing = message.reactions.find((r) => r.reaction === emoji);
      try {
        const updated = existing?.mine
          ? await removeReaction(message.id, emoji)
          : await addReaction(message.id, emoji);
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } catch (error) {
        toast.error(errorText(error));
      }
    },
    [toast],
  );

  const togglePin = useCallback(
    async (message: ChatMessage) => {
      if (!activeId) return;
      try {
        if (message.pinned) {
          await unpinMessage(activeId, message.id);
          setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, pinned: false } : m)));
        } else {
          const updated = await pinMessage(activeId, message.id);
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      } catch (error) {
        toast.error(errorText(error));
      }
    },
    [activeId, toast],
  );

  const removeMessage = useCallback(
    async (message: ChatMessage) => {
      if (!window.confirm("Delete this message?")) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isDeleted: true, content: null } : m)));
      try {
        await deleteMessage(message.id);
      } catch (error) {
        toast.error(errorText(error));
      }
    },
    [toast],
  );

  const applyConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === conversation.id ? conversation : c)));
  }, []);

  const confirmForward = useCallback(
    async (conversationId: string) => {
      if (!forwardTarget) return;
      try {
        await forwardMessage(forwardTarget.id, conversationId);
        toast.success("Message forwarded");
      } catch (error) {
        toast.error(errorText(error));
      } finally {
        setForwardTarget(null);
      }
    },
    [forwardTarget, toast],
  );

  const saveSettings = useCallback(
    async (patch: Partial<ChatSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      setSavingSettings(true);
      try {
        const saved = await updateSettings(patch);
        setSettings(saved);
      } catch (error) {
        toast.error(errorText(error));
        getSettings()
          .then(setSettings)
          .catch(() => {});
      } finally {
        setSavingSettings(false);
      }
    },
    [toast],
  );

  const handleTyping = useCallback((isTyping: boolean) => {
    const client = socketRef.current;
    if (!client?.connected || !activeIdRef.current) return;
    client.emit(isTyping ? "typing:start" : "typing:stop", { conversationId: activeIdRef.current });
  }, []);

  /* ---------------- derived ---------------- */

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const isOnline = useCallback(
    (employeeId: string | null | undefined) => (employeeId ? presences[employeeId] ?? false : false),
    [presences],
  );

  const activeConversation = useMemo(() => {
    if (!active) return null;
    return {
      ...active,
      counterpart: active.counterpart
        ? { ...active.counterpart, online: isOnline(active.counterpart.employeeId) }
        : null,
      members: active.members.map((member) => ({ ...member, online: isOnline(member.employeeId) })),
    };
  }, [active, isOnline]);

  const nameFor = useCallback(
    (employeeId: string) => {
      for (const conversation of conversations) {
        if (conversation.counterpart?.employeeId === employeeId) return conversation.counterpart.name;
        const member = conversation.members.find((m) => m.employeeId === employeeId);
        if (member) return member.name;
      }
      return "Someone";
    },
    [conversations],
  );

  const typingNames = useMemo(() => {
    if (!activeId) return [];
    return Object.keys(typingMap[activeId] ?? {}).map(nameFor);
  }, [activeId, typingMap, nameFor]);

  const isTypingIn = useCallback(
    (conversationId: string) => Object.keys(typingMap[conversationId] ?? {}).length > 0,
    [typingMap],
  );

  const online = activeConversation && !activeConversation.isGroup
    ? isOnline(activeConversation.counterpart?.employeeId)
    : false;

  /* ---------------- list interactions ---------------- */

  const toggleArchivedView = useCallback(() => {
    setLoadingConversations(true);
    setArchived((value) => !value);
    setActiveId(null);
    activeIdRef.current = null;
    setMessages([]);
    setPane("list");
    setGroupInfoOpen(false);
  }, []);

  const handleToggleMute = useCallback(async () => {
    if (!active) return;
    try {
      applyConversation(await updateMemberSettings(active.id, { isMuted: !active.isMuted }));
    } catch (error) {
      toast.error(errorText(error));
    }
  }, [active, applyConversation, toast]);

  const handleToggleArchive = useCallback(async () => {
    if (!active) return;
    try {
      const updated = await updateMemberSettings(active.id, { isArchived: !active.isArchived });
      if (updated.isArchived === archived) {
        applyConversation(updated);
      } else {
        setConversations((prev) => prev.filter((c) => c.id !== updated.id));
        setActiveId(null);
        activeIdRef.current = null;
        setMessages([]);
        setPane("list");
      }
    } catch (error) {
      toast.error(errorText(error));
    }
  }, [active, archived, applyConversation, toast]);

  const handleCreated = useCallback(
    (conversation: Conversation) => {
      socketRef.current?.emit("chat:join", { conversationId: conversation.id });
      setConversations((prev) => [conversation, ...prev.filter((c) => c.id !== conversation.id)]);
      seedPresence([conversation]);
      openConversation(conversation.id);
    },
    [openConversation, seedPresence],
  );

  const handleLeftGroup = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeIdRef.current === conversationId) {
      setActiveId(null);
      activeIdRef.current = null;
      setMessages([]);
      setPane("list");
    }
  }, []);

  return (
    <div className="h-full min-h-0">
      <div className="card flex h-full min-h-0 overflow-hidden rounded-none lg:rounded-xl">
        <div
          className={`${pane === "thread" ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-1 md:flex-none`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            loading={loadingConversations}
            query={query}
            onQueryChange={setQuery}
            archived={archived}
            onToggleArchived={toggleArchivedView}
            onSelect={openConversation}
            onNew={() => setNewOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            isOnline={isOnline}
            isTyping={isTypingIn}
            myId={meId}
          />
        </div>

        <div className={`${pane === "list" ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-1 flex-col`}>
          {activeConversation ? (
            <MessageThread
              conversation={activeConversation}
              messages={messages}
              meId={meId}
              loading={loadingMessages}
              hasMore={hasMore}
              loadingMore={loadingMore}
              online={online}
              typingNames={typingNames}
              onLoadMore={loadMore}
              onReply={setReplyingTo}
              onEdit={(message) => {
                setEditing(message);
                setReplyingTo(null);
                setText(message.content ?? "");
              }}
              onDelete={removeMessage}
              onForward={setForwardTarget}
              onToggleReaction={toggleReaction}
              onTogglePin={togglePin}
              onOpenImage={setLightbox}
              onToggleMute={handleToggleMute}
              onToggleArchive={handleToggleArchive}
              onOpenGroupInfo={() => setGroupInfoOpen(true)}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenPinned={() => setPinnedOpen(true)}
              onBack={() => setPane("list")}
              footer={
                <Composer
                  value={text}
                  onChange={setText}
                  onSend={handleSend}
                  onUpload={handleUpload}
                  sending={sending}
                  replyingTo={replyingTo}
                  editing={editing}
                  onCancelContext={() => {
                    setReplyingTo(null);
                    setEditing(null);
                    setText("");
                  }}
                  onTyping={handleTyping}
                />
              }
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-subtle)]">
                <Icon name="MessageSquare" size={24} />
              </div>
              <p className="text-[0.9rem] font-semibold text-[var(--text)]">Your messages</p>
              <p className="max-w-xs text-[0.82rem] text-[var(--text-muted)]">
                Select a conversation from the list to start chatting with your team.
              </p>
            </div>
          )}
        </div>
      </div>

      <NewConversationDialog open={newOpen} onClose={() => setNewOpen(false)} onCreated={handleCreated} />

      <GroupInfoDrawer
        open={groupInfoOpen}
        conversation={activeConversation}
        meId={meId}
        onClose={() => setGroupInfoOpen(false)}
        onUpdated={applyConversation}
        onLeft={handleLeftGroup}
      />

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onOpenResult={openConversation} />

      <PinnedDialog
        open={pinnedOpen}
        conversationId={activeId}
        onClose={() => setPinnedOpen(false)}
        onOpenMessage={() => setPinnedOpen(false)}
      />

      <ForwardDialog
        open={forwardTarget !== null}
        conversations={conversations}
        onClose={() => setForwardTarget(null)}
        onForward={confirmForward}
      />

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        saving={savingSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={saveSettings}
      />

      <Lightbox attachment={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
