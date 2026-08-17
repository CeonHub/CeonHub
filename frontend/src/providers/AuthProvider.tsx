"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type { Role, SessionUser } from "@/lib/types";

interface AuthContextValue {
  user: SessionUser | null;
  /** True until the first /auth/me call settles. */
  loading: boolean;
  /**
   * Password sign-in, used only by the staff page: candidates and employers sign in
   * with LinkedIn, which is a browser redirect rather than an API call.
   */
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Where each role lands after signing in. */
export function homePathFor(role: Role): string {
  switch (role) {
    case "CANDIDATE":
      return "/candidate/dashboard";
    case "EMPLOYER":
      return "/employer/dashboard";
    case "ADMIN":
      return "/admin";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: SessionUser }>("/api/auth/me");
      setUser(data.user);
    } catch (error) {
      // 401/403 simply means "not signed in"; anything else is also not fatal here,
      // the affected page will surface its own error when it loads data.
      if (!(error instanceof ApiError)) throw error;
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reading the session is exactly the "subscribe to an external system" case an
    // effect is for; the state updates happen asynchronously, after the request
    // resolves, not during this render pass.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUser();
  }, [loadUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await apiFetch<{ user: SessionUser }>("/api/auth/login", {
          method: "POST",
          body: { email, password },
        });
        setUser(data.user);
        return data.user;
      },
      async logout() {
        await apiFetch("/api/auth/logout", { method: "POST" });
        setUser(null);
      },
      refresh: loadUser,
    }),
    [user, loading, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
