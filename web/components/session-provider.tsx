"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearMirrors, readMirrors, saveMirror } from "@/lib/mirror-client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

interface SessionValue {
  user: SessionUser | null;
  loading: boolean;
  storage: string;
  storageLabel: string;
  durable: boolean;
  weakSecret: boolean;
  chatModel: string;
  chatEnabled: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
  storage: string;
  storageLabel: string;
  durable: boolean;
  chat: { model: string; providerEnabled: boolean };
  warnings: { weakSecret: boolean };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [storage, setStorage] = useState("memory");
  const [storageLabel, setStorageLabel] = useState("In-browser (demo)");
  const [durable, setDurable] = useState(false);
  const [weakSecret, setWeakSecret] = useState(false);
  const [chatModel, setChatModel] = useState("");
  const [chatEnabled, setChatEnabled] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SessionResponse;
      setUser(data.authenticated ? data.user : null);
      setStorage(data.storage);
      setStorageLabel(data.storageLabel);
      setDurable(data.durable);
      setWeakSecret(data.warnings?.weakSecret ?? false);
      setChatModel(data.chat?.model ?? "");
      setChatEnabled(Boolean(data.chat?.providerEnabled));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const post = useCallback(
    async (url: string, payload: Record<string, unknown>) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, mirrors: readMirrors() }),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: SessionUser;
        mirror?: string | null;
        storage?: string;
        storageLabel?: string;
      };
      if (!res.ok) return { ok: false as const, error: data.error || "Something went wrong." };
      if (data.user) setUser(data.user);
      if (data.mirror) saveMirror(data.mirror);
      if (data.storage) setStorage(data.storage);
      if (data.storageLabel) setStorageLabel(data.storageLabel);
      return { ok: true as const };
    },
    [],
  );

  const signIn = useCallback(
    (email: string, password: string) => post("/api/auth/signin", { email, password }),
    [post],
  );

  const signUp = useCallback(
    (name: string, email: string, password: string) =>
      post("/api/auth/signup", { name, email, password }),
    [post],
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST", cache: "no-store" }).catch(() => null);
    clearMirrors();
    setUser(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      loading,
      storage,
      storageLabel,
      durable,
      weakSecret,
      chatModel,
      chatEnabled,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [
      user,
      loading,
      storage,
      storageLabel,
      durable,
      weakSecret,
      chatModel,
      chatEnabled,
      signIn,
      signUp,
      signOut,
      refresh,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
