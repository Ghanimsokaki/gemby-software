"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ArrowUp, BookOpen, Bot, Sparkles, Trash2, User } from "lucide-react";
import { Markdown } from "./markdown";
import type { ChatMsg } from "@/lib/use-chat";

interface Props {
  messages: ChatMsg[];
  busy: boolean;
  error: string | null;
  suggestions: readonly string[];
  onSend: (text: string) => void;
  onClear: () => void;
  variant?: "widget" | "page";
  modelLabel?: string;
  modelEnabled?: boolean;
  greetingName?: string;
}

function ProviderTag({ msg, modelLabel }: { msg: ChatMsg; modelLabel?: string }) {
  if (msg.failed) return null;
  const isModel = msg.provider === "model";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[0.6rem] tracking-tight ${
        isModel
          ? "border-brand-400/25 bg-brand-400/10 text-brand-300"
          : "border-white/10 bg-white/[0.04] text-slate-500"
      }`}
      title={
        isModel
          ? `Answered by ${msg.model ?? modelLabel ?? "the chat model"}`
          : "Answered from the built-in GembyAV knowledge base"
      }
    >
      {isModel ? <Sparkles className="size-2.5" /> : <BookOpen className="size-2.5" />}
      {isModel ? "Gemby-2-agent" : "knowledge base"}
    </span>
  );
}

export function ChatThread({
  messages,
  busy,
  error,
  suggestions,
  onSend,
  onClear,
  variant = "widget",
  modelLabel,
  modelEnabled,
  greetingName,
}: Props) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const compact = variant === "widget";

  // Follow the conversation as it grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (!busy && !compact) inputRef.current?.focus();
  }, [busy, compact]);

  function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoGrow(e: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 96 : 180)}px`;
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const chips = lastAssistant?.suggestions?.length ? lastAssistant.suggestions : suggestions;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ---------------------------------------------------------- messages */}
      <div
        ref={scrollRef}
        className={`scrollbar-slim min-h-0 flex-1 overflow-y-auto px-3 ${compact ? "py-3" : "py-6"} sm:px-4`}
      >
        {messages.length === 0 ? (
          <EmptyState
            compact={compact}
            suggestions={suggestions}
            onPick={(s) => onSend(s)}
            modelEnabled={modelEnabled}
            modelLabel={modelLabel}
            greetingName={greetingName}
          />
        ) : (
          <div className={`mx-auto flex w-full flex-col gap-3 ${compact ? "" : "max-w-3xl"}`}>
            {messages.map((m) => (
              <Message key={m.id} msg={m} compact={compact} modelLabel={modelLabel} />
            ))}

            {busy ? (
              <div className="flex items-start gap-2.5">
                <Avatar />
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3.5">
                  <div className="typing flex items-center">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            ) : null}

            {!busy && lastAssistant?.sources?.length ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-9">
                <span className="text-[0.66rem] tracking-wide text-slate-600 uppercase">Sources</span>
                {lastAssistant.sources.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[0.68rem] text-slate-400"
                  >
                    {s.title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- error */}
      {error ? (
        <div className="mx-3 mb-2 rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-[0.75rem] text-alert-300 sm:mx-4">
          {error}
        </div>
      ) : null}

      {/* ------------------------------------------------------- suggestions */}
      {chips.length > 0 && !busy ? (
        <div
          className={`scrollbar-slim flex gap-1.5 overflow-x-auto px-3 pb-2 sm:px-4 ${
            messages.length === 0 ? "hidden" : ""
          }`}
        >
          {chips.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              className="shrink-0 rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[0.72rem] text-slate-400 transition-colors hover:border-brand-400/40 hover:bg-brand-400/[0.07] hover:text-brand-200"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {/* ---------------------------------------------------------- composer */}
      <div className="border-t border-white/[0.07] bg-abyss/60 p-2.5 sm:p-3">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-panel/70 p-1.5 transition-colors focus-within:border-brand-400/45">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={autoGrow}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask about installing, scanning, quarantine, YARA rules…"
            className="scrollbar-slim max-h-[180px] min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[0.86rem] text-slate-100 placeholder:text-slate-600 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            {messages.length > 0 ? (
              <button
                onClick={onClear}
                title="Clear conversation"
                aria-label="Clear conversation"
                className="grid size-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-alert-300"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
            <button
              onClick={submit}
              disabled={!draft.trim() || busy}
              title="Send (Enter)"
              aria-label="Send message"
              className="grid size-9 place-items-center rounded-lg bg-gradient-to-b from-brand-400 to-brand-600 text-void transition-all duration-150 hover:from-brand-300 hover:to-brand-500 disabled:opacity-35 disabled:hover:from-brand-400 disabled:hover:to-brand-600"
            >
              <ArrowUp className="size-[18px]" strokeWidth={2.6} />
            </button>
          </div>
        </div>
        <p className="mt-1.5 px-1 text-[0.66rem] leading-relaxed text-slate-600">
          <kbd className="font-mono text-slate-500">Enter</kbd> to send ·{" "}
          <kbd className="font-mono text-slate-500">Shift+Enter</kbd> for a new line
          {modelEnabled && modelLabel ? (
            <>
              {" "}
              · powered by <span className="font-mono text-slate-500">{modelLabel}</span>
            </>
          ) : (
            <> · answers from the built-in GembyAV knowledge base</>
          )}
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- pieces */

function Avatar({ user = false }: { user?: boolean }) {
  return (
    <span
      className={`grid size-8 shrink-0 place-items-center rounded-xl border ${
        user
          ? "border-white/10 bg-white/[0.06] text-slate-300"
          : "border-brand-400/30 bg-brand-400/10 text-brand-300"
      }`}
    >
      {user ? <User className="size-4" /> : <Bot className="size-4" />}
    </span>
  );
}

function Message({
  msg,
  compact,
  modelLabel,
}: {
  msg: ChatMsg;
  compact: boolean;
  modelLabel?: string;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex items-start justify-end gap-2.5">
        <div
          className={`max-w-[85%] rounded-2xl rounded-tr-sm border border-brand-400/25 bg-brand-500/[0.13] px-3.5 py-2.5 text-[0.87rem] leading-relaxed text-slate-100 ${
            compact ? "" : ""
          }`}
        >
          <p className="break-words whitespace-pre-wrap">{msg.content}</p>
        </div>
        <Avatar user />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <Avatar />
      <div className="min-w-0 max-w-[88%] flex-1">
        <div
          className={`glass rounded-2xl rounded-tl-sm px-3.5 py-3 ${
            msg.failed ? "border-alert-500/30" : ""
          }`}
        >
          <Markdown source={msg.content} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-1">
          <ProviderTag msg={msg} modelLabel={modelLabel} />
          <span className="font-mono text-[0.62rem] text-slate-600">
            {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  compact,
  suggestions,
  onPick,
  modelEnabled,
  modelLabel,
  greetingName,
}: {
  compact: boolean;
  suggestions: readonly string[];
  onPick: (s: string) => void;
  modelEnabled?: boolean;
  modelLabel?: string;
  greetingName?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-14"}`}>
      <span className="relative grid size-14 place-items-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-2xl border border-brand-400/40" />
        <span className="grid size-14 place-items-center rounded-2xl border border-brand-400/30 bg-brand-400/10 text-brand-300">
          <Bot className="size-7" />
        </span>
      </span>

      <h3 className={`mt-4 font-semibold text-white ${compact ? "text-base" : "text-xl"}`}>
        {greetingName ? `Hey ${greetingName.split(" ")[0]} — need a hand?` : "How can I help?"}
      </h3>
      <p
        className={`mt-1.5 max-w-sm text-slate-400 ${compact ? "text-[0.8rem]" : "text-[0.9rem]"}`}
      >
        I am Gemby, the support assistant. I know the engine inside out —{" "}
        {modelEnabled && modelLabel ? (
          <>
            answering with <span className="font-mono text-brand-300">{modelLabel}</span>, grounded
            in the official docs.
          </>
        ) : (
          "answering from the built-in knowledge base."
        )}
      </p>

      <div
        className={`mt-5 flex flex-wrap justify-center gap-1.5 ${compact ? "max-w-[280px]" : "max-w-xl"}`}
      >
        {suggestions.slice(0, compact ? 4 : 6).map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[0.75rem] text-slate-300 transition-all hover:border-brand-400/40 hover:bg-brand-400/[0.08] hover:text-brand-200"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
