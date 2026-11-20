"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/api";
import { chatSocketUrl } from "@/lib/chat";
import { useAuth } from "@/lib/auth-context";

/* =========================================================
   Chat socket provider
   ---------------------------------------------------------
   One Socket.IO connection per signed-in employee, created only
   when their role grants the `chat` module. The connection is
   keyed by employee id, so switching accounts disposes the old
   socket and opens a fresh authenticated one.

   The handshake reads the access token through a callback, so a
   rotated token is picked up on the next automatic reconnect
   without tearing the socket down on every refresh.
   ========================================================= */

interface ChatSocketValue {
  socket: Socket | null;
  connected: boolean;
}

const ChatSocketContext = createContext<ChatSocketValue>({ socket: null, connected: false });

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { user, can, loading } = useAuth();
  const userId = user?.id ?? null;
  const enabled = !loading && !!userId && can("chat");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Tearing down is handled by the previous run's cleanup, so the disabled
    // case only needs to bail out without touching state.
    if (!enabled || !userId || !getAccessToken()) return;

    const client = io(chatSocketUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: (cb) => cb({ token: getAccessToken() ?? "" }),
    });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    client.on("connect", onConnect);
    client.on("disconnect", onDisconnect);
    // Publishing the live socket instance is the purpose of this effect (the
    // subscription itself), which the linter cannot tell apart from a cascading
    // render, so this one assignment is suppressed deliberately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(client);

    return () => {
      client.off("connect", onConnect);
      client.off("disconnect", onDisconnect);
      client.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [enabled, userId]);

  const value = useMemo<ChatSocketValue>(() => ({ socket, connected }), [socket, connected]);
  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket(): ChatSocketValue {
  return useContext(ChatSocketContext);
}
