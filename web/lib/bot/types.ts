export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Source {
  id: string;
  title: string;
  group: string;
}

export type ProviderKind = "model" | "knowledge-base";

export interface BotReply {
  reply: string;
  provider: ProviderKind;
  /** model id when a model answered */
  model?: string;
  sources: Source[];
  suggestions: string[];
  /** true when the answer was grounded in retrieved KB context */
  grounded: boolean;
}
