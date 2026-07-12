import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { GoogleProvider } from "@/lib/ai/providers/google";
import { MockProvider } from "@/lib/ai/providers/mock";
import { OpenAIProvider } from "@/lib/ai/providers/openai";
import type { ChatProvider, ProviderId, ProviderInfo } from "@/lib/ai/types";

/**
 * Provider registry. Adapters are stateless; configuration is read from
 * process.env at request time, so adding a key to the environment activates
 * the real provider on the next request — no code change, no rebuild.
 */
const PROVIDERS: readonly ChatProvider[] = [
  new AnthropicProvider(),
  new OpenAIProvider(),
  new GoogleProvider(),
  new MockProvider(),
];

const isProviderId = (value: string): value is ProviderId =>
  PROVIDERS.some((p) => p.id === value);

/** The provider used when the client doesn't ask for a specific one. */
export const defaultProvider = (): ChatProvider => {
  const wanted = process.env.AI_DEFAULT_PROVIDER;
  if (wanted && isProviderId(wanted)) {
    const provider = PROVIDERS.find((p) => p.id === wanted);
    if (provider?.isConfigured()) return provider;
  }
  // First configured real provider wins; mock is always configured and last.
  return PROVIDERS.find((p) => p.isConfigured()) ?? (PROVIDERS.at(-1) as ChatProvider);
};

/**
 * Resolve the provider that will actually serve a request. An unconfigured
 * or unknown request falls back to the mock provider rather than failing —
 * "the only missing piece is the credential".
 */
export const resolveProvider = (requested?: string | null): ChatProvider => {
  if (requested && isProviderId(requested)) {
    const provider = PROVIDERS.find((p) => p.id === requested);
    if (provider?.isConfigured()) return provider;
    return PROVIDERS.find((p) => p.id === "mock") as ChatProvider;
  }
  return defaultProvider();
};

/** Key-free provider list for the client UI. */
export const listProviders = (): ProviderInfo[] => {
  const def = defaultProvider();
  return PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    model: p.model(),
    configured: p.isConfigured(),
    isDefault: p.id === def.id,
  }));
};
