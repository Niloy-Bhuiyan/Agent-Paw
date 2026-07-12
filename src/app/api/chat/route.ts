import type { NextRequest } from "next/server";
import { getMaxTokens, getSystemPrompt } from "@/lib/ai/persona";
import { resolveProvider } from "@/lib/ai/registry";
import { ProviderError, type ChatMessage, type ChatWireEvent } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 4000;

interface ChatRequestBody {
  provider?: string;
  messages?: Array<{ role?: string; content?: string }>;
  /** Optional companion-memory context appended to the system prompt. */
  context?: string;
}

const sanitizeMessages = (raw: ChatRequestBody["messages"]): ChatMessage[] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages: ChatMessage[] = [];
  for (const item of raw.slice(-MAX_MESSAGES)) {
    if ((item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string") {
      return null;
    }
    const content = item.content.slice(0, MAX_MESSAGE_LENGTH).trim();
    if (content) messages.push({ role: item.role, content });
  }
  return messages.length > 0 && messages.at(-1)?.role === "user" ? messages : null;
};

const encodeEvent = (event: ChatWireEvent): Uint8Array =>
  new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);

/**
 * POST /api/chat — streams the companion's reply as Server-Sent Events.
 * Protocol: start → delta* → done, or error (with retryability) at any point.
 */
export async function POST(request: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  if (!messages) {
    return Response.json(
      { error: "messages must alternate user/assistant strings ending with a user turn" },
      { status: 400 },
    );
  }

  const provider = resolveProvider(body.provider);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encodeEvent({
          type: "start",
          provider: provider.id,
          model: provider.model(),
          mock: provider.id === "mock",
        }),
      );

      const context =
        typeof body.context === "string" && body.context.trim()
          ? `\n\nKnown context about this user (from companion memory):\n${body.context.slice(0, 1200)}`
          : "";

      try {
        const events = provider.chat(messages, {
          system: getSystemPrompt() + context,
          maxTokens: getMaxTokens(),
          signal: request.signal,
        });
        for await (const event of events) {
          if (event.type === "delta") {
            controller.enqueue(encodeEvent({ type: "delta", text: event.text }));
          }
        }
        controller.enqueue(encodeEvent({ type: "done" }));
      } catch (error) {
        if (request.signal.aborted) {
          controller.close();
          return;
        }
        const providerError =
          error instanceof ProviderError
            ? error
            : new ProviderError("Unexpected server error.", { retryable: true, cause: error });
        console.error(`[api/chat] ${provider.id} failed:`, error);
        controller.enqueue(
          encodeEvent({
            type: "error",
            message: providerError.message,
            retryable: providerError.retryable,
          }),
        );
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
