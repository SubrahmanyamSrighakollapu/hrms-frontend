"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  api,
  AUTH_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type TokenPair,
} from "@/lib/api";
import {
  can as canDo,
  formatJoin,
  initials,
  resetRbac,
  type EmployeeDef,
  type PermissionLevel,
} from "@/lib/rbac";

/** Role as returned on the session payload (no permission matrix). */
export interface SessionRole {
  id: string;
  key: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
}

interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  roleId: string | null;
  status: string;
  department: string | null;
  designation: string | null;
  joinedAt: string | null;
}

interface SessionPayload {
  user: ApiUser;
  role: SessionRole | null;
  permissions: Record<string, PermissionLevel>;
  tokens?: TokenPair;
}

interface AuthContextValue {
  /** The signed-in employee. */
  user: EmployeeDef | null;
  /** The role assigned to that employee. */
  role: SessionRole | null;
  /** Flattened permissions of the assigned role (moduleId → level). */
  permissions: Record<string, PermissionLevel>;
  /** Permission check: can(moduleId) or can(moduleId, "MANAGE"). */
  can: (moduleId: string, level?: Exclude<PermissionLevel, "NONE">) => boolean;
  /** True while the stored session is being restored. */
  loading: boolean;
  /** Sign in with email + password; the role comes from the account. */
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toEmployeeDef(user: ApiUser): EmployeeDef {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    dept: user.department ?? "—",
    title: user.designation ?? "—",
    status: user.status === "ACTIVE" ? "Active" : "Inactive",
    join: formatJoin(user.joinedAt),
    avatar: initials(user.fullName),
    roleId: user.roleId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the stored token on first load.
  useEffect(() => {
    let active = true;

    (async () => {
      if (!getAccessToken()) {
        if (active) setLoading(false);
        return;
      }
      try {
        const me = await api.get<SessionPayload>("/auth/me");
        if (active) setSession(me);
      } catch {
        clearTokens();
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // React to the token pair being wiped (failed refresh, sign-out in another
  // tab). A successful refresh keeps the tokens, so the session stays intact.
  useEffect(() => {
    const dropSession = () => {
      if (getAccessToken()) return;
      setSession(null);
      resetRbac();
    };

    window.addEventListener(AUTH_EVENT, dropSession);
    window.addEventListener("storage", dropSession);

    return () => {
      window.removeEventListener(AUTH_EVENT, dropSession);
      window.removeEventListener("storage", dropSession);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.post<SessionPayload>("/auth/login", { email, password });
    if (result.tokens) setTokens(result.tokens);
    // Drop any role cache left over from a previous session before showing the new one.
    resetRbac();
    setSession({ user: result.user, role: result.role, permissions: result.permissions });
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Send the refresh token too, so the session is revoked even if the
      // access token has already expired.
      await api.post("/auth/logout", { refreshToken: getRefreshToken() ?? undefined });
    } catch {
      // Ignore — the local session is cleared regardless.
    }
    clearTokens();
    resetRbac();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session ? toEmployeeDef(session.user) : null;
    const permissions = session?.permissions ?? {};

    return {
      user,
      role: session?.role ?? null,
      permissions,
      can: (moduleId, level = "VIEW") => canDo(permissions, moduleId, level),
      loading,
      signIn,
      signOut,
    };
  }, [session, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
