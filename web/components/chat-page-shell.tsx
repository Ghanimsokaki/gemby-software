"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Search, Sparkles, BookOpen } from "lucide-react";
import { ChatThread } from "./chat-thread";
import { useSession } from "./session-provider";
import { useChat } from "@/lib/use-chat";

export interface TopicGroup {
  group: string;
  items: string[];
}

export function ChatPageShell({
  name,
  initialQuery,
  topics,
}: {
  name?: string;
  initialQuery?: string;
  topics: TopicGroup[];
}) {
  const { user, chatModel, chatEnabled } = useSession();
  const { messages, busy, error, send, clear, suggestions } = useChat(user?.id);
  const [filter, setFilter] = useState("");
  const asked = useRef(false);

  // Deep links like /chat?q=smartscreen fire the question once.
  useEffect(() => {
    const q = initialQuery?.trim();
    if (!q || asked.current || !user) return;
    asked.current = true;
    void send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, user]);

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? topics
        .map((g) => ({ ...g, items: g.items.filter((i) => i.toLowerCase().includes(needle)) }))
        .filter((g) => g.items.length)
    : topics;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:h-[calc(100dvh-4rem)] lg:flex-row lg:py-10">
      {/* --------------------------------------------------------- sidebar */}
      <aside className="flex shrink-0 flex-col lg:w-72">
        <div className="flex items-center gap-2.5">
          <span className="relative grid size-10 place-items-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-xl border border-brand-400/35" />
            <span className="grid size-10 place-items-center rounded-xl border border-brand-400/30 bg-brand-400/10 text-brand-300">
              <Bot className="size-5" />
            </span>
          </span>
          <div>
            <h1 className="text-[1.05rem] leading-tight font-semibold text-white">
              Gemby Assistant
            </h1>
            <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] text-slate-500">
              {chatEnabled ? (
                <>
                  <Sparkles className="size-3 text-brand-400" />
                  <span className="font-mono">{chatModel}</span>
                </>
              ) : (
                <>
                  <BookOpen className="size-3 text-brand-400" />
                  Knowledge base mode
                </>
              )}
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-600" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter topics…"
            className="h-9 w-full rounded-lg border border-white/10 bg-abyss/70 pr-3 pl-9 text-[0.8rem] text-slate-200 transition-colors placeholder:text-slate-600 focus:border-brand-400/50 focus:outline-none"
          />
        </div>

        <div className="scrollbar-slim mt-4 min-h-0 flex-1 overflow-y-auto pr-1 lg:pb-4">
          {visible.map((g) => (
            <div key={g.group} className="mb-5">
              <p className="mb-2 text-[0.66rem] font-semibold tracking-[0.14em] text-slate-600 uppercase">
                {g.group}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => void send(item)}
                      disabled={busy}
                      className="w-full rounded-lg px-2.5 py-2 text-left text-[0.8rem] leading-snug text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-brand-200 disabled:opacity-50"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {visible.length === 0 ? (
            <p className="px-2.5 py-4 text-[0.8rem] text-slate-600">
              No topic matches “{filter}”. Try “scan”, “quarantine” or “yara”.
            </p>
          ) : null}
        </div>
      </aside>

      {/* ----------------------------------------------------------- thread */}
      <section className="glass flex min-h-[70dvh] flex-1 flex-col overflow-hidden rounded-2xl lg:min-h-0">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-panel/50 px-4 py-3">
          <p className="text-[0.85rem] text-slate-400">
            {name ? (
              <>
                Asking as <span className="font-medium text-slate-200">{name}</span>
              </>
            ) : (
              "Conversation"
            )}
          </p>
          <p className="hidden text-[0.72rem] text-slate-600 sm:block">
            Saved in this browser · {messages.length} message{messages.length === 1 ? "" : "s"}
          </p>
        </header>

        <ChatThread
          messages={messages}
          busy={busy}
          error={error}
          suggestions={suggestions}
          onSend={send}
          onClear={clear}
          variant="page"
          modelLabel={chatModel}
          modelEnabled={chatEnabled}
          greetingName={name}
        />
      </section>
    </div>
  );
}
