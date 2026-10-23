"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Lock, MessageSquare, Sparkles, X } from "lucide-react";
import { ChatThread } from "./chat-thread";
import { useSession } from "./session-provider";
import { useChat } from "@/lib/use-chat";

const NUDGE_KEY = "gembyav.chat-nudge.v1";

/**
 * Floating support assistant, present on every page.
 *
 * The conversation itself is a signed-in feature, so a signed-out visitor gets
 * a short explanation and a one-click route to the auth screens instead of a
 * dead input box.
 */
export function ChatWidget() {
  const { user, loading, chatModel, chatEnabled } = useSession();
  const { messages, busy, error, send, clear, suggestions } = useChat(user?.id);
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const pathname = usePathname();

  // One-time attention nudge, dismissed forever on first open.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(NUDGE_KEY)) return;
    const t = setTimeout(() => setNudge(true), 9000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open && nudge) {
      setNudge(false);
      try {
        window.localStorage.setItem(NUDGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [open, nudge]);

  // Start closed on the dedicated chat page — it has its own full UI.
  useEffect(() => {
    if (pathname === "/chat") setOpen(false);
  }, [pathname]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const firstName = user?.name?.split(" ")[0];

  return (
    <>
      {/* ----------------------------------------------------------- panel */}
      {open ? (
        <div
          className="fixed right-3 bottom-[5.25rem] z-40 flex origin-bottom-right animate-rise flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-abyss/95 shadow-[0_24px_70px_-18px_rgba(0,0,0,.9)] backdrop-blur-2xl sm:right-5 sm:bottom-24"
          style={{
            width: "min(23.5rem, calc(100vw - 1.5rem))",
            height: "min(33rem, calc(100dvh - 8.5rem))",
          }}
          role="dialog"
          aria-label="GembyAV support assistant"
        >
          <header className="flex items-center gap-2.5 border-b border-white/[0.07] bg-panel/60 px-3.5 py-3">
            <span className="relative grid size-8 place-items-center">
              <span className="absolute inset-0 rounded-lg border border-brand-400/30 bg-brand-400/10" />
              <Bot className="relative size-4 text-brand-300" />
              {busy ? (
                <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-gold-400 ring-2 ring-panel" />
              ) : (
                <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-mint-400 ring-2 ring-panel" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.85rem] font-semibold text-white">Gemby Assistant</p>
              <p className="flex items-center gap-1 truncate text-[0.68rem] text-slate-500">
                {chatEnabled ? (
                  <>
                    <Sparkles className="size-2.5 text-brand-400" />
                    <span className="font-mono">{chatModel}</span>
                  </>
                ) : (
                  <>Knowledge base · always on</>
                )}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <X className="size-4" />
            </button>
          </header>

          {user ? (
            <ChatThread
              messages={messages}
              busy={busy}
              error={error}
              suggestions={suggestions}
              onSend={send}
              onClear={clear}
              variant="widget"
              modelLabel={chatModel}
              modelEnabled={chatEnabled}
              greetingName={firstName}
            />
          ) : (
            <SignedOutPanel loading={loading} />
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------ nudge bubble */}
      {nudge && !open && user ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-3 bottom-24 z-40 max-w-[15rem] animate-rise rounded-xl border border-brand-400/25 bg-panel/95 px-3.5 py-2.5 text-left text-[0.78rem] text-slate-300 shadow-[0_14px_40px_-14px_rgba(0,0,0,.9)] backdrop-blur-xl transition-colors hover:border-brand-400/50 sm:right-5"
        >
          Stuck on SmartScreen or a false positive? Ask me.
          <span className="absolute -bottom-1 right-6 size-2.5 rotate-45 border-r border-b border-brand-400/25 bg-panel/95" />
        </button>
      ) : null}

      {/* -------------------------------------------------------- launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open support assistant"}
        aria-expanded={open}
        className={`group fixed right-3 bottom-3 z-50 grid size-14 place-items-center rounded-2xl transition-all duration-200 sm:right-5 sm:bottom-5 ${
          open
            ? "bg-panel text-slate-300 hover:text-white"
            : "bg-gradient-to-br from-brand-400 to-brand-700 text-void shadow-[0_10px_40px_-8px_rgba(34,211,238,.8)] hover:scale-105"
        }`}
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <>
            <MessageSquare className="size-6" strokeWidth={2.2} />
            <span className="absolute -top-0.5 -right-0.5 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint-400 opacity-70" />
              <span className="relative inline-flex size-3 rounded-full bg-mint-400 ring-2 ring-void" />
            </span>
          </>
        )}
      </button>
    </>
  );
}

function SignedOutPanel({ loading }: { loading: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-brand-400/25 bg-brand-400/[0.08] text-brand-300">
        <Lock className="size-5" />
      </span>
      <div>
        <h3 className="text-[0.95rem] font-semibold text-white">Sign in to chat</h3>
        <p className="mt-1.5 text-[0.8rem] leading-relaxed text-slate-400">
          {loading
            ? "Checking your session…"
            : "The support assistant and the installer are both behind a free account, so your conversation stays with you."}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/signup"
          className="h-10 w-full rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 text-sm font-semibold text-void transition-all hover:from-brand-300 hover:to-brand-500"
          style={{ display: "grid", placeItems: "center" }}
        >
          Create free account
        </Link>
        <Link
          href="/signin"
          className="h-10 w-full rounded-xl border border-white/10 text-sm text-slate-300 transition-colors hover:border-brand-400/40 hover:text-white"
          style={{ display: "grid", placeItems: "center" }}
        >
          I already have one
        </Link>
      </div>
      <p className="text-[0.68rem] leading-relaxed text-slate-600">
        No telemetry, no licence keys. An account only gates the download and keeps your chat
        history.
      </p>
    </div>
  );
}
