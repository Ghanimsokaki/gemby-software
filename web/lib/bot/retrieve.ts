import { ARTICLES, FALLBACK, type Article } from "./knowledge";
import { REFUSAL } from "./safety";

/**
 * Tiny deterministic retriever. No embeddings, no network — it just has to be
 * good enough to pull the right 1–3 articles out of ~30 for both the offline
 * answerer and the context injected into the chat model.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "do",
  "does", "did", "i", "you", "it", "its", "my", "your", "our", "we", "they",
  "to", "of", "in", "on", "at", "for", "with", "about", "how", "what", "why",
  "when", "where", "which", "who", "can", "could", "should", "would", "will",
  "shall", "may", "might", "must", "and", "or", "but", "if", "then", "than",
  "so", "as", "by", "from", "up", "down", "out", "off", "over", "under",
  "again", "further", "once", "here", "there", "all", "any", "both", "each",
  "few", "more", "most", "other", "some", "such", "no", "not", "only", "own",
  "same", "too", "very", "just", "me", "him", "her", "them", "this", "that",
  "these", "those", "am", "please", "hey", "hi", "hello", "ok", "okay",
]);

/** Tokens in the same group stand in for one another at reduced weight. */
const SYNONYM_GROUPS: string[][] = [
  ["antivirus", "av", "anti-virus", "virus", "malware", "threat", "gembyav", "gemby"],
  ["download", "install", "installer", "setup", "exe", "binary"],
  ["quarantine", "vault", "isolate", "isolated", "quarantined"],
  ["restore", "recover", "recovery", "undo", "unquarantine"],
  ["hash", "checksum", "sha256", "sha-256", "digest", "integrity", "verify"],
  ["smartscreen", "blocked", "unsigned", "unrecognized", "publisher", "warning", "defender-warning"],
  ["realtime", "real-time", "live", "watchdog", "monitor", "monitoring", "background", "protection"],
  ["scan", "scanning", "scanner", "sweep", "check"],
  ["yara", "yar", "rule", "rules", "signature", "signatures", "pattern", "patterns", "definitions"],
  ["log", "logs", "logging", "appdata", "trace", "audit"],
  ["false-positive", "falsepositive", "fp", "mistake", "wrongly", "legit", "legitimate"],
  ["uninstall", "remove", "delete", "cleanup", "erase"],
  ["password", "login", "signin", "sign-in", "signup", "sign-up", "account", "register", "auth", "credentials"],
  ["privacy", "telemetry", "tracking", "gdpr", "personal", "data"],
  ["crash", "crashes", "freeze", "frozen", "error", "fail", "fails", "broken", "hang"],
  ["defender", "microsoft", "windows-security", "conflict", "coexist"],
  ["eicar", "test", "testing", "sample"],
  ["free", "price", "pricing", "cost", "license", "licence", "paid", "opensource", "open-source"],
  ["mac", "macos", "linux", "ubuntu", "debian", "platform", "platforms", "windows"],
  ["build", "compile", "pyinstaller", "source", "python", "rebuild"],
  ["performance", "slow", "speed", "cpu", "memory", "fast", "resources"],
  ["bug", "issue", "issues", "report", "contact", "feedback", "support", "developer"],
  ["score", "scoring", "verdict", "verdicts", "suspicious", "malicious", "threshold", "detection", "detections"],
  ["update", "updates", "updating", "refresh"],
  ["requirement", "requirements", "specs", "minimum", "system"],
];

const SYNONYM_INDEX = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const token of group) SYNONYM_INDEX.set(token, group);
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_/\\|]+/g, " ")
    .replace(/[^a-z0-9\s.%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export interface Scored {
  article: Article;
  score: number;
  matched: string[];
}

export interface RetrieveOptions {
  /** Article the conversation is currently on; used as a light tiebreaker. */
  topic?: Article | null;
}

export function retrieve(query: string, limit = 3, opts: RetrieveOptions = {}): Scored[] {
  const q = normalize(query);
  const tokens = tokenize(query);
  if (!q) return [];

  const tokenSet = new Set(tokens);
  const expanded = new Set<string>();
  for (const t of tokens) {
    for (const syn of SYNONYM_INDEX.get(t) ?? []) {
      if (!tokenSet.has(syn)) expanded.add(syn);
    }
  }

  const scored: Scored[] = [];

  for (const article of ARTICLES) {
    let score = 0;
    const matched: string[] = [];

    // 1. multi-word phrases are the strongest signal
    for (const phrase of article.phrases) {
      const p = normalize(phrase);
      if (!p) continue;
      if (q.includes(p)) {
        score += 6 + p.split(" ").length * 1.5;
        matched.push(phrase);
        continue;
      }
      // partial phrase overlap: 2+ consecutive words present
      const words = p.split(" ");
      if (words.length >= 2) {
        let hits = 0;
        for (const w of words) if (tokenSet.has(w)) hits += 1;
        if (hits >= 2 && hits / words.length >= 0.5) {
          score += 2.2 * hits;
          matched.push(phrase);
        }
      }
    }

    // 2. single keywords
    for (const kw of article.keywords) {
      const k = normalize(kw);
      if (tokenSet.has(k)) {
        score += 2.4;
        matched.push(kw);
      } else if (expanded.has(k)) {
        score += 1.1;
      } else if (k.length > 4 && q.includes(k)) {
        score += 1.6;
        matched.push(kw);
      }
    }

    // 3. title words
    for (const w of tokenize(article.title)) {
      if (tokenSet.has(w)) score += 1.8;
    }

    // 4. conversational continuity — deliberately small, so it only nudges
    //    ambiguous follow-ups and never overrides a confident direct hit.
    if (opts.topic) {
      if (article.id === opts.topic.id) score += 2.0;
      else if (article.group === opts.topic.group) score += 0.8;
    }

    if (score > 0) scored.push({ article, score, matched: [...new Set(matched)] });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Above this raw score the question stands on its own and conversation
 * context is ignored — otherwise every follow-up would just repeat the
 * previous answer.
 */
const SELF_SUFFICIENT = 8;

export function retrieveWithContext(
  query: string,
  topic?: Article | null,
  limit = 3,
): Scored[] {
  const raw = retrieve(query, limit);
  if (!topic || (raw[0]?.score ?? 0) >= SELF_SUFFICIENT) return raw;
  return retrieve(query, limit, { topic });
}

/** Minimum score for the offline engine to commit to an answer. */
export const CONFIDENCE_FLOOR = 5;

export function buildContext(hits: Scored[], maxChars = 4200): string {
  let out = "";
  for (const { article } of hits) {
    const block = `### ${article.title}\n${article.answer}\n\n`;
    if (out.length + block.length > maxChars) break;
    out += block;
  }
  return out.trim();
}

/**
 * Work out which KB article produced a previous assistant reply, so a terse
 * follow-up ("and how do I undo that?") can be resolved against the topic the
 * conversation is actually on.
 *
 * Offline answers are the article text verbatim, so prefix matching is exact.
 * Model answers are paraphrased, so we fall back to scoring the reply itself.
 */
export function identifyArticle(reply: string): Article | null {
  if (!reply) return null;
  // Strip the decorations answerOffline appends.
  const core = reply
    .split(/\n+---\n+/)[0]
    .replace(/\*\(Best match:.*?\)\*/s, "")
    .trim();
  const probe = core.slice(0, 90);
  if (probe.length < 20) return null;

  for (const article of ARTICLES) {
    if (article.answer.trim().startsWith(probe.slice(0, 60))) return article;
  }

  // An "I don't know" reply carries no topic — and scoring its text would
  // pick up every subject it merely mentions, so bail out instead.
  if (core.startsWith(FALLBACK.slice(0, 48))) return null;
  if (core.startsWith(REFUSAL.slice(0, 48))) return null;

  // Paraphrased (model) reply — retrieve against the text it produced.
  return retrieve(core, 1)[0]?.article ?? null;
}

/* ------------------------------------------------------- conversational */

export type SmallTalk = "greeting" | "thanks" | "farewell" | null;

export function detectSmallTalk(query: string): SmallTalk {
  const q = normalize(query);
  const words = q.split(" ").filter(Boolean);
  if (words.length > 6) return null;

  if (/^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening)|howdy|sup|halo|selamat)\b/.test(q)) {
    return "greeting";
  }
  if (/^(how are you|how('?s| is) it going|you ok|you good)\b/.test(q)) return "greeting";
  if (/\b(thanks|thank you|thx|ty|appreciate it|cheers|terima kasih)\b/.test(q)) return "thanks";
  if (/^(bye|goodbye|see (ya|you)|later|cya|good night)\b/.test(q)) return "farewell";
  return null;
}
