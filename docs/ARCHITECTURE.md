# Architecture

Next.js 15 (App Router) · React 19 · strict TypeScript · Tailwind 4 ·
Framer Motion · Lenis. All pages statically prerendered except the two
API routes.

## Layers

```
┌─ Pages (src/app) ───────────────────────────────────────────┐
│  /            landing recreation                             │
│  /pet         AI Companion Pet + Voice Companion             │
│  /companion   chat workspace                                 │
│  /showcase /download /reset-license   secondary pages        │
│  /api/chat /api/providers             server (SSE streaming) │
└──────────────────────────────────────────────────────────────┘
┌─ Feature systems ────────────────────────────────────────────┐
│  src/companion-pet/   registries: emotions, reactions,       │
│                       metrics, dialogue, achievements, tools │
│                       + world sources, memory, settings      │
│  src/companion-pet/voice/  STT/TTS adapters, mic meter,      │
│                       wake word, conversation orchestrator   │
│  src/lib/ai/          provider adapters + registry (server)  │
│  src/lib/agents/      agent-status sources (client)          │
└──────────────────────────────────────────────────────────────┘
┌─ Engine ─────────────────────────────────────────────────────┐
│  src/animations/pixel-cat/  procedural sprite renderer +     │
│                             rAF behavior engine + palettes   │
└──────────────────────────────────────────────────────────────┘
┌─ Shared ─────────────────────────────────────────────────────┐
│  components/ (layout, sections, pet, ui)  hooks/  contexts/  │
│  lib/i18n/  lib/events/  lib/store/  styles/  types/  utils/ │
└──────────────────────────────────────────────────────────────┘
```

## Key design decisions

- **Registries over switch statements.** Emotions, reactions, metrics,
  personalities, achievements, tools and providers are all `Map`-backed
  registries with `register*()` functions. UI (including Settings) is
  generated from the registries, so extensions need no core edits.
- **Adapter pattern at every boundary.** AI providers (`ChatProvider`),
  dev-world feeds (`DevWorldSource`), agent feeds (`AgentActivitySource`),
  STT (`SttAdapter`), TTS (`TtsAdapter`). Every adapter has a mock twin;
  factories pick real implementations when env/browser support exists.
- **Env-driven activation.** Configuration is read from `process.env` at
  request time server-side — adding a key activates a provider with no
  code change (`src/lib/ai/registry.ts`).
- **Dependency-free state.** Two `useSyncExternalStore` stores
  (companion chat, pet settings) plus a typed event bus. No state
  library; selective subscriptions avoid re-render storms.
- **Canvas for the creature, DOM for the chrome.** The cat is a single
  canvas driven by a rAF state machine (pauses off-screen via
  IntersectionObserver, DPR capped at 2). Bubbles/widgets are DOM with
  Framer Motion, memoized on displayed value.
- **SSE for streaming.** `/api/chat` emits a 4-event protocol
  (`start/delta/done/error`); one shared client parser
  (`src/lib/ai/sse-client.ts`) serves both chat surfaces.

## Data flow (voice conversation)

```
hotkey → SttAdapter (interim stream) → tool router ──match──▶ local reply
                                     └─ no match → POST /api/chat (SSE)
world snapshot ─▶ metrics registry ─▶ widgets      │ deltas
reply ─▶ markdown window ─▶ TtsAdapter speaks ─▶ emotion FSM ─▶ cat engine
```

## Error handling & recovery

- Provider failures normalize to `ProviderError { retryable, status }`;
  client auto-retries transient errors with backoff, then surfaces RETRY.
- Global error boundary (`src/app/error.tsx`) and custom 404 with reset.
- Voice: STT/TTS errors surface inline; conversation returns to idle;
  interruption cancels fetch + speech atomically.
- Storage failures (private mode) degrade to in-memory state.

## Security

- No secrets client-side; `/api/providers` returns key-free status only.
- Chat input sanitized server-side (role whitelist, length caps, turn cap).
- Security headers via `next.config.ts` (nosniff, frame-deny, referrer
  policy, permissions policy scoping mic to same origin).
