import {
  ProviderError,
  type ChatMessage,
  type ChatProvider,
  type ChatRequestOptions,
  type ProviderStreamEvent,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Google Gemini adapter (REST streamGenerateContent with SSE — no SDK,
 * demonstrating the raw-HTTP adapter pattern).
 * Environment variables:
 *   GOOGLE_API_KEY (or GEMINI_API_KEY) — required to activate
 *   GOOGLE_MODEL                       — optional, defaults to gemini-2.0-flash
 */
export class GoogleProvider implements ChatProvider {
  readonly id = "google" as const;
  readonly label = "Gemini (Google)";

  private apiKey(): string | undefined {
    return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  model(): string {
    return process.env.GOOGLE_MODEL || DEFAULT_MODEL;
  }

  async *chat(
    messages: ChatMessage[],
    opts: ChatRequestOptions,
  ): AsyncIterable<ProviderStreamEvent> {
    const url = `${API_BASE}/models/${this.model()}:streamGenerateContent?alt=sse`;

    const response = await fetch(url, {
      method: "POST",
      signal: opts.signal,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": this.apiKey() ?? "",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        generationConfig: { maxOutputTokens: opts.maxTokens },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    }).catch((cause) => {
      throw new ProviderError("Could not reach the Gemini API.", { retryable: true, cause });
    });

    if (!response.ok || !response.body) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new ProviderError(`Gemini API error (${response.status}).`, {
        retryable,
        status: response.status,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          const text = extractText(payload);
          if (text) yield { type: "delta", text };
        }
      }
      yield { type: "done" };
    } finally {
      reader.releaseLock();
    }
  }
}

interface GeminiChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

const extractText = (payload: string): string => {
  try {
    const chunk = JSON.parse(payload) as GeminiChunk;
    return (
      chunk.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? ""
    );
  } catch {
    return "";
  }
};
