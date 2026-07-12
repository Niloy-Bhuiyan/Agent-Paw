import Anthropic from "@anthropic-ai/sdk";
import {
  ProviderError,
  type ChatMessage,
  type ChatProvider,
  type ChatRequestOptions,
  type ProviderStreamEvent,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "claude-opus-4-8";

/**
 * Claude adapter (official @anthropic-ai/sdk, Messages API streaming).
 * Configured entirely through environment variables:
 *   ANTHROPIC_API_KEY  — required to activate
 *   ANTHROPIC_MODEL    — optional, defaults to claude-opus-4-8
 * The SDK retries 429/5xx with backoff internally (max_retries default 2).
 */
export class AnthropicProvider implements ChatProvider {
  readonly id = "anthropic" as const;
  readonly label = "Claude (Anthropic)";

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  model(): string {
    return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  async *chat(
    messages: ChatMessage[],
    opts: ChatRequestOptions,
  ): AsyncIterable<ProviderStreamEvent> {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    try {
      const stream = client.messages.stream(
        {
          model: this.model(),
          max_tokens: opts.maxTokens,
          system: opts.system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        },
        { signal: opts.signal },
      );

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "delta", text: event.delta.text };
        }
      }

      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        throw new ProviderError("Claude declined this request.", { retryable: false });
      }
      yield { type: "done" };
    } catch (error) {
      throw toProviderError(error);
    }
  }
}

const toProviderError = (error: unknown): ProviderError => {
  if (error instanceof ProviderError) return error;
  if (error instanceof Anthropic.AuthenticationError) {
    return new ProviderError("Anthropic API key is invalid.", {
      retryable: false,
      status: 401,
      cause: error,
    });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new ProviderError("Anthropic rate limit hit — try again shortly.", {
      retryable: true,
      status: 429,
      cause: error,
    });
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new ProviderError("Could not reach the Anthropic API.", {
      retryable: true,
      cause: error,
    });
  }
  if (error instanceof Anthropic.APIError) {
    const status = typeof error.status === "number" ? error.status : undefined;
    return new ProviderError(`Anthropic API error (${status ?? "unknown"}).`, {
      retryable: status === undefined || status >= 500,
      status,
      cause: error,
    });
  }
  return new ProviderError("Unexpected Anthropic provider failure.", {
    retryable: true,
    cause: error,
  });
};
