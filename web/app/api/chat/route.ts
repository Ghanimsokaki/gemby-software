import { NextResponse } from "next/server";
import { ask, type ChatMessage } from "@/lib/bot";
import { readSession } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A cold model call can take a while; keep us clear of the default ceiling.
export const maxDuration = 30;

const MAX_TURNS = 24;
const MAX_CHARS = 4000;

function sanitizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || typeof m !== "object") continue;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (typeof content !== "string") continue;
    if (role !== "user" && role !== "assistant") continue; // never trust a client "system"
    const trimmed = content.slice(0, MAX_CHARS).trim();
    if (trimmed) out.push({ role, content: trimmed });
  }
  return out.length ? out : null;
}

export async function POST(req: Request) {
  // The assistant is a signed-in feature — same gate as the download.
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to talk to the assistant." },
      { status: 401 },
    );
  }

  const limit = rateLimit(clientKey(req, `chat:${session.sub}`), {
    limit: 25,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: `You are sending messages too quickly. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = sanitizeMessages((body as { messages?: unknown })?.messages);
  if (!messages) {
    return NextResponse.json({ error: "Send at least one message." }, { status: 400 });
  }

  try {
    const result = await ask({ messages });
    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(limit.remaining) },
    });
  } catch (err) {
    console.error("[chat] failed:", err);
    return NextResponse.json(
      { error: "The assistant hit an error. Please try again." },
      { status: 500 },
    );
  }
}
