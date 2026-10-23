import { CHAT_MODEL } from "@/lib/config";
import type { ChatMessage } from "./types";

/**
 * Hugging Face chat provider — talks to `Hwiiiiiiii/Gemby-2-agent`.
 *
 * Three endpoint shapes are tried in order, because a HF model id can be
 * served several ways and we cannot know which one the deployer has:
 *
 *   1. HF_ENDPOINT_URL / GEMBY_CHAT_ENDPOINT  — an explicit URL you control
 *      (dedicated Inference Endpoint, Space, or self-hosted vLLM/Ollama).
 *   2. router.huggingface.co/v1/chat/completions — HF Inference Providers,
 *      OpenAI-compatible, the current recommended route.
 *   3. api-inference.huggingface.co/models/<id> — the legacy serverless
 *      text-generation shape ({ inputs, parameters }).
 *
 * Every failure resolves to `null` so the caller can fall back to the offline
 * knowledge base instead of showing the user an error.
 */

export interface ModelReply {
  text: string;
  endpoint: string;
}

export interface ProviderConfig {
  model: string;
  token?: string;
  endpoints: string[];
  enabled: boolean;
  label: string;
}

const ROUTER = "https://router.huggingface.co/v1/chat/completions";
const TIMEOUT_MS = Number(process.env.GEMBY_CHAT_TIMEOUT_MS || 20000);

export function providerConfig(): ProviderConfig {
  const token =
    process.env.HF_TOKEN ||
    process.env.HF_API_KEY ||
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HUGGINGFACE_TOKEN ||
    undefined;
  const model = process.env.GEMBY_CHAT_MODEL || CHAT_MODEL;
  const custom =
    process.env.HF_ENDPOINT_URL || process.env.GEMBY_CHAT_ENDPOINT || undefined;

  const endpoints: string[] = [];
  if (custom) endpoints.push(custom);
  endpoints.push(ROUTER);
  endpoints.push(`https://api-inference.huggingface.co/models/${model}`);

  // A public model may answer without a token on the legacy endpoint, so we
  // only require *something* to be configured before we spend time trying.
  const enabled = Boolean(token || custom);

  return {
    model,
    token,
    endpoints,
    enabled,
    label: model,
  };
}

function legacyPrompt(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      if (m.role === "system") return `<|system|>\n${m.content}`;
      if (m.role === "assistant") return `<|assistant|>\n${m.content}`;
      return `<|user|>\n${m.content}`;
    })
    .join("\n\n")
    .concat("\n\n<|assistant|>\n");
}

function isLegacy(url: string): boolean {
  return url.includes("api-inference.huggingface.co");
}

/** HF and OpenAI-compatible servers disagree on response shape. Handle all. */
function extractText(json: unknown): string | null {
  if (typeof json === "string") return json.trim() || null;
  if (!json || typeof json !== "object") return null;

  if (Array.isArray(json)) {
    for (const item of json) {
      const t = extractText(item);
      if (t) return t;
    }
    return null;
  }

  const o = json as Record<string, unknown>;

  const choices = o.choices;
  if (Array.isArray(choices) && choices.length) {
    const first = choices[0] as Record<string, unknown>;
    const msg = first.message as Record<string, unknown> | undefined;
    if (msg && typeof msg.content === "string") return msg.content.trim() || null;
    if (typeof first.text === "string") return first.text.trim() || null;
    if (typeof first.generated_text === "string") return first.generated_text.trim() || null;
  }

  for (const key of ["generated_text", "text", "output", "response", "completion"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  // some inference endpoints nest under { token: { text } } or { message }
  const message = o.message as Record<string, unknown> | undefined;
  if (message && typeof message.content === "string") return message.content.trim() || null;

  return null;
}

async function callOnce(
  url: string,
  messages: ChatMessage[],
  cfg: ProviderConfig,
): Promise<ModelReply | null> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

  const body = isLegacy(url)
    ? {
        inputs: legacyPrompt(messages),
        parameters: {
          max_new_tokens: 700,
          temperature: 0.4,
          top_p: 0.92,
          return_full_text: false,
          repetition_penalty: 1.12,
        },
        options: { wait_for_model: true, use_cache: false },
      }
    : {
        model: cfg.model,
        messages,
        max_tokens: 900,
        temperature: 0.4,
        top_p: 0.92,
      };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      console.warn(`[bot] ${url} -> HTTP ${res.status} ${detail}`);
      return null;
    }

    const text = extractText(await res.json().catch(() => null));
    if (!text) {
      console.warn(`[bot] ${url} -> empty/unparsable response`);
      return null;
    }
    return { text: sanitize(text), endpoint: url };
  } catch (err) {
    const e = err as Error;
    console.warn(`[bot] ${url} -> ${e.name === "AbortError" ? "timeout" : e.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Strip chat-template leftovers and trim runaway whitespace. */
function sanitize(text: string): string {
  return text
    .replace(/<\|\/?(system|user|assistant|im_start|im_end|endoftext)\|>/gi, "")
    .replace(/^\s*assistant\s*:\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function askModel(messages: ChatMessage[]): Promise<ModelReply | null> {
  const cfg = providerConfig();
  if (!cfg.enabled) return null;
  for (const url of cfg.endpoints) {
    const reply = await callOnce(url, messages, cfg);
    if (reply) return reply;
  }
  return null;
}
