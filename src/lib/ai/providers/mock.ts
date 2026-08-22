import {
  ProviderError,
  type ChatMessage,
  type ChatProvider,
  type ChatRequestOptions,
  type ProviderStreamEvent,
} from "@/lib/ai/types";

const OPENERS = [
  "*stretches paws*",
  "*perks ears*",
  "*hops onto the keyboard*",
  "*blinks slowly*",
  "*flicks tail*",
];

const CLOSERS = [
  "Meow!",
  "Nya~",
  "*resumes kneading*",
  "Now, back to my nap.",
  "Don't forget to stretch!",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hash = (text: string): number => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const buildReply = (messages: ChatMessage[]): string => {
  const last = messages.filter((m) => m.role === "user").at(-1)?.content.trim() ?? "";
  const seed = hash(last);
  const opener = OPENERS[seed % OPENERS.length];
  const closer = CLOSERS[(seed >> 3) % CLOSERS.length];
  const topic = last.length > 64 ? `${last.slice(0, 64)}…` : last;

  if (!topic) return `${opener} You woke me up for... nothing? ${closer}`;
  if (/stretch|break|tired/i.test(topic))
    return `${opener} Yes! Paws up, reach for the ceiling, hold it... perfect. ${closer}`;
  if (/name/i.test(topic))
    return `${opener} I'm AgentPaw — the pixel cat living rent-free in your computer. ${closer}`;
  if (/\?$/.test(topic))
    return `${opener} Hmm, "${topic}" — my whiskers say the answer is closer than you think. I'm a mock cat though; add a real API key and I get much smarter. ${closer}`;
  return `${opener} I heard "${topic}" and I have decided it is very interesting. Tell me more while I sit on your warm laptop. ${closer}`;
};

/**
 * Zero-dependency provider used when no API key is configured. Streams a
 * persona-appropriate reply word by word so the whole UI pipeline —
 * streaming, status, animations — behaves exactly like a real provider.
 */
export class MockProvider implements ChatProvider {
  readonly id = "mock" as const;
  readonly label = "Mock Cat (offline)";

  isConfigured(): boolean {
    return true;
  }

  model(): string {
    return "mock-cat-1";
  }

  async *chat(
    messages: ChatMessage[],
    opts: ChatRequestOptions,
  ): AsyncIterable<ProviderStreamEvent> {
    if (process.env.AI_MOCK_SIMULATE_ERRORS === "true" && Math.random() < 0.25) {
      await sleep(600);
      throw new ProviderError("Simulated mock outage (AI_MOCK_SIMULATE_ERRORS=true)", {
        retryable: true,
        status: 529,
      });
    }

    // Simulated "thinking" pause before the first token.
    await sleep(450 + Math.random() * 500);

    const words = buildReply(messages).split(" ");
    for (const [i, word] of words.entries()) {
      opts.signal?.throwIfAborted();
      yield { type: "delta", text: i === 0 ? word : ` ${word}` };
      await sleep(24 + Math.random() * 40);
    }
    yield { type: "done" };
  }
}
