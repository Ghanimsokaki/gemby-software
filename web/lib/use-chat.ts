"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProviderKind, Source } from "./bot/types";
import { SUGGESTED_PROMPTS } from "./bot/suggestions";

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  sources?: Source[];
  provider?: ProviderKind;
  model?: string;
  suggestions?: string[];
  failed?: boolean;
}

const MAX_PERSISTED = 60;

function storageKey(userId?: string | null) {
  return `gembyav.chat.${userId ?? "anonymous"}`;
}

function load(userId?: string | null): ChatMsg[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m): m is ChatMsg => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_PERSISTED);
  } catch {
    return [];
  }
}

function persist(userId: string | null | undefined, msgs: ChatMsg[]) {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(msgs.slice(-MAX_PERSISTED)));
  } catch {
    /* quota — non-fatal */
  }
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

export function useChat(userId?: string | null) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const inflight = useRef(false);

  // Re-hydrate whenever the signed-in user changes.
  useEffect(() => {
    setMessages(load(userId));
    setError(null);
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (hydrated) persist(userId, messages);
  }, [messages, hydrated, userId]);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || inflight.current) return;
      if (clean.length > 4000) {
        setError("Messages are limited to 4000 characters.");
        return;
      }

      inflight.current = true;
      setBusy(true);
      setError(null);

      const userMsg: ChatMsg = { id: uid(), role: "user", content: clean, at: Date.now() };
      // Snapshot of the thread we send upstream (the new user turn included).
      const outgoing = [...messages, userMsg].slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: outgoing }),
          cache: "no-store",
        });

        const data = (await res.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
          provider?: ProviderKind;
          model?: string;
          sources?: Source[];
          suggestions?: string[];
        };

        if (!res.ok) {
          if (res.status === 401) {
            setError("Your session expired. Sign in again to keep chatting.");
          } else {
            setError(data.error || `Request failed (${res.status}).`);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content:
                data.error ||
                "Sorry — I could not reach the assistant just then. Please try again in a moment.",
              at: Date.now(),
              failed: true,
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: data.reply ?? "…",
            at: Date.now(),
            provider: data.provider,
            model: data.model,
            sources: data.sources ?? [],
            suggestions: data.suggestions ?? [],
          },
        ]);
      } catch {
        setError("Network error. Check your connection and try again.");
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "I could not reach the server. Check your connection and try again.",
            at: Date.now(),
            failed: true,
          },
        ]);
      } finally {
        inflight.current = false;
        setBusy(false);
      }
    },
    [messages],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined" && userId) {
      try {
        window.localStorage.removeItem(storageKey(userId));
      } catch {
        /* ignore */
      }
    }
  }, [userId]);

  return {
    messages,
    busy,
    error,
    hydrated,
    send,
    clear,
    suggestions: SUGGESTED_PROMPTS,
  };
}
