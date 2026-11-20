"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role } from "@/lib/nav-config";
import { DEMO_USER } from "@/lib/nav-config";

interface AuthUser {
  name: string;
  email: string;
  role: Role;
  avatar: string;
  title: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  setRole: (role: Role) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "hrms.role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (stored) setRoleState(stored);
  }, []);

  const setRole = (r: Role) => {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRoleState(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user: role ? DEMO_USER[role] : null,
    setRole,
    signOut,
  }), [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
