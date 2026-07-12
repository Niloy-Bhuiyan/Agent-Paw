import OpenAI from "openai";
import {
  ProviderError,
  type ChatMessage,
  type ChatProvider,
  type ChatRequestOptions,
  type ProviderStreamEvent,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * OpenAI adapter (official openai SDK, Chat Completions streaming).
 * Environment variables:
 *   OPENAI_API_KEY   — required to activate
 *   OPENAI_MODEL     — optional, defaults to gpt-4o-mini
 *   OPENAI_BASE_URL  — optional, for OpenAI-compatible gateways
 */
export class OpenAIProvider implements ChatProvider {
  readonly id = "openai" as const;
  readonly label = "OpenAI";

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  model(): string {
    return process.env.OPENAI_MODEL || DEFAULT_MODEL;
  }

  async *chat(
    messages: ChatMessage[],
    opts: ChatRequestOptions,
  ): AsyncIterable<ProviderStreamEvent> {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    try {
      const stream = await client.chat.completions.create(
        {
          model: this.model(),
          max_completion_tokens: opts.maxTokens,
          stream: true,
          messages: [
            { role: "system", content: opts.system },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        },
        { signal: opts.signal },
      );

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield { type: "delta", text };
      }
      yield { type: "done" };
    } catch (error) {
      throw toProviderError(error);
    }
  }
}

const toProviderError = (error: unknown): ProviderError => {
  if (error instanceof ProviderError) return error;
  if (error instanceof OpenAI.AuthenticationError) {
    return new ProviderError("OpenAI API key is invalid.", {
      retryable: false,
      status: 401,
      cause: error,
    });
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new ProviderError("OpenAI rate limit hit — try again shortly.", {
      retryable: true,
      status: 429,
      cause: error,
    });
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new ProviderError("Could not reach the OpenAI API.", { retryable: true, cause: error });
  }
  if (error instanceof OpenAI.APIError) {
    const status = typeof error.status === "number" ? error.status : undefined;
    return new ProviderError(`OpenAI API error (${status ?? "unknown"}).`, {
      retryable: status === undefined || status >= 500,
      status,
      cause: error,
    });
  }
  return new ProviderError("Unexpected OpenAI provider failure.", {
    retryable: true,
    cause: error,
  });
};
