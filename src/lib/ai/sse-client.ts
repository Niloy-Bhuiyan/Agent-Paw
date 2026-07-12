import type { ChatWireEvent } from "@/lib/ai/types";

/**
 * Shared browser-side SSE consumer for /api/chat streams.
 * Used by both the chat companion and the voice pet.
 */
export async function consumeChatSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatWireEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const data = frame
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("");
        if (!data) continue;
        try {
          onEvent(JSON.parse(data) as ChatWireEvent);
        } catch {
          // skip malformed frame
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
