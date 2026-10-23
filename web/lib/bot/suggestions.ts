/**
 * Starter prompts shown in an empty conversation.
 *
 * Kept in its own module so the client bundle can import it without dragging
 * the whole knowledge base (knowledge.ts) into the browser.
 */
export const SUGGESTED_PROMPTS = [
  "How do I install GembyAV?",
  "Windows SmartScreen blocked the download",
  "Where are quarantined files stored?",
  "How do I add my own YARA rule?",
  "What does a SUSPICIOUS verdict mean?",
  "Does it conflict with Windows Defender?",
] as const;
