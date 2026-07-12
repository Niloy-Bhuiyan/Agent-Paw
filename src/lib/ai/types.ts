/** Shared types for the AI companion provider architecture. */

export type ProviderId = "mock" | "anthropic" | "openai" | "google";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Public, key-free description of a provider (safe to send to the client). */
export interface ProviderInfo {
  id: ProviderId;
  label: string;
  model: string;
  configured: boolean;
  isDefault: boolean;
}

/** Events emitted by a provider adapter while generating a reply. */
export type ProviderStreamEvent = { type: "delta"; text: string } | { type: "done" };

export interface ChatRequestOptions {
  system: string;
  maxTokens: number;
  signal?: AbortSignal;
}

/**
 * The adapter contract. One implementation per provider; the registry decides
 * at request time which one serves a chat based on env configuration.
 */
export interface ChatProvider {
  readonly id: ProviderId;
  readonly label: string;
  /** True when the required environment variables are present. */
  isConfigured(): boolean;
  /** Resolved model id (env override or default). */
  model(): string;
  /** Stream a reply. Implementations throw ProviderError on failure. */
  chat(messages: ChatMessage[], opts: ChatRequestOptions): AsyncIterable<ProviderStreamEvent>;
}

/** Normalized provider failure with retry semantics for the client. */
export class ProviderError extends Error {
  readonly retryable: boolean;
  readonly status?: number;

  constructor(message: string, opts: { retryable: boolean; status?: number; cause?: unknown }) {
    super(message, { cause: opts.cause });
    this.name = "ProviderError";
    this.retryable = opts.retryable;
    this.status = opts.status;
  }
}

/** Wire protocol streamed from /api/chat to the browser (SSE `data:` payloads). */
export type ChatWireEvent =
  | { type: "start"; provider: ProviderId; model: string; mock: boolean }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string; retryable: boolean };
