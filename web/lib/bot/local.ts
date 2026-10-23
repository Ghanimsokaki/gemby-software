import {
  ARTICLES,
  FALLBACK,
  FAREWELL,
  GREETINGS,
  THANKS,
  type Article,
} from "./knowledge";
import {
  CONFIDENCE_FLOOR,
  detectSmallTalk,
  retrieveWithContext,
  type Scored,
} from "./retrieve";
import { REFUSAL, detectHarmful } from "./safety";
import type { BotReply, Source } from "./types";

/**
 * The offline answerer. Deterministic, instant, and always available — it is
 * both the fallback when no model/token is configured and the answer source
 * for small talk (which is not worth a round trip).
 */

function pick<T>(arr: readonly T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function toSource(a: Article): Source {
  return { id: a.id, title: a.title, group: a.group };
}

function suggestionsFor(hits: Scored[]): string[] {
  const out: string[] = [];
  for (const h of hits.slice(0, 2)) {
    for (const f of h.article.followUps ?? []) out.push(f);
  }
  // de-dupe, keep order, cap at 3
  return [...new Set(out)].slice(0, 3);
}

export function refusalReply(): BotReply {
  return {
    reply: REFUSAL,
    provider: "knowledge-base",
    sources: ["patterns", "yara", "verdicts"]
      .map((id) => ARTICLES.find((a) => a.id === id))
      .filter((a): a is Article => Boolean(a))
      .map(toSource),
    suggestions: [
      "What does it detect?",
      "How do I add my own YARA rule?",
      "What do the verdicts mean?",
    ],
    grounded: false,
  };
}

export function answerOffline(query: string, topic: Article | null = null): BotReply {
  // Offensive-security requests are refused before anything else.
  if (detectHarmful(query)) return refusalReply();

  const small = detectSmallTalk(query);
  if (small === "greeting") {
    return {
      reply: pick(GREETINGS, query),
      provider: "knowledge-base",
      sources: [toSource(ARTICLES.find((a) => a.id === "bot-help")!)],
      suggestions: [
        "How do I install GembyAV?",
        "What does it detect?",
        "Where are quarantined files?",
      ],
      grounded: false,
    };
  }
  if (small === "thanks") {
    return {
      reply: pick(THANKS, query),
      provider: "knowledge-base",
      sources: [],
      suggestions: ["How do signature updates work?", "Test it with EICAR"],
      grounded: false,
    };
  }
  if (small === "farewell") {
    return {
      reply: pick(FAREWELL, query),
      provider: "knowledge-base",
      sources: [],
      suggestions: [],
      grounded: false,
    };
  }

  // A terse follow-up is resolved against the previous turn's topic.
  const hits = retrieveWithContext(query, topic, 3);
  const best = hits[0];
  // With conversational context we can commit on weaker evidence.
  const floor = topic ? CONFIDENCE_FLOOR / 2 : CONFIDENCE_FLOOR;

  if (!best || best.score < floor) {
    // No sources here: claiming a match we did not use would be misleading.
    return {
      reply: FALLBACK,
      provider: "knowledge-base",
      sources: [],
      suggestions: [
        "What is GembyAV?",
        "Windows SmartScreen blocked the download",
        "How do I run a full scan?",
      ],
      grounded: false,
    };
  }

  const article = best.article;
  let reply = article.answer;

  // When a second article is nearly as relevant, point at it rather than
  // dumping two long answers into the thread.
  const runner = hits[1];
  if (runner && runner.score >= best.score * 0.72 && runner.article.id !== article.id) {
    reply += `\n\n---\n\n**Related:** ${runner.article.title}`;
  }

  const confidence =
    best.score >= floor * 2.4
      ? ""
      : `\n\n*(Best match: “${article.title}”. If that is not what you meant, try rephrasing — or ask me what I can help with.)*`;

  return {
    reply: reply + confidence,
    provider: "knowledge-base",
    sources: hits.slice(0, 3).map((h) => toSource(h.article)),
    suggestions: suggestionsFor(hits),
    grounded: true,
  };
}
