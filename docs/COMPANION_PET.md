# AI Companion Pet — architecture & integration guide

The pet lives at **`/pet`**. The cat itself is the interface: information
appears around it as speech bubbles, thought bubbles, pixel signs, sticky
notes, floating widgets, particles and toasts. There is no dashboard.

```
DevWorldSource ──events──▶ Reaction registry ──▶ Emotion FSM ──▶ Cat engine
      │                          │                    │             (canvas)
      │                          └─▶ Dialogue pack ──▶ Bubbles
      └──world snapshot──▶ Metric registry ──▶ Floating widgets
                                 └─▶ Achievements ──▶ Toasts + XP
```

All core modules live in `src/companion-pet/`; UI in
`src/components/pet-companion/`.

## Extension points (all plugin-based)

| To add a… | Call | Where |
| --- | --- | --- |
| Emotion | `registerEmotion(def)` | `src/companion-pet/emotions.ts` |
| Event type | extend `DevEventType` union | `src/companion-pet/types.ts` |
| Reaction | `registerReaction(def)` | `src/companion-pet/reactions.ts` |
| Metric / info source | `registerMetric(def)` | `src/companion-pet/metrics.ts` |
| Personality / dialogue pack | `registerPersonality(id, pack)` | `src/companion-pet/dialogue.ts` |
| Achievement | `registerAchievement(def)` | `src/companion-pet/achievements.ts` |
| Pet species | add a renderer to the cat engine (`sprite.ts`) or swap `PixelCat` in `PetStage` — everything upstream is species-agnostic | `src/animations/pixel-cat/` |
| Sound pack | listen for `window` `CustomEvent("pet:sound", { detail: { hook } })`; hooks fire only when the user enables sounds (off by default) | anywhere client-side |

A new emotion/reaction/metric requires **zero changes** to the FSM, stage or
settings UI — registries drive everything, and Settings toggles are generated
from the registries.

## Data sources: Mock vs Live

`createWorldSource()` (`src/companion-pet/world.ts`) picks the source:

- **`MockDevWorld`** (default) — a believable simulated dev session:
  AI generations with live token streaming, builds, tests, git activity,
  package installs, indexing, system hiccups, wellness nudges. Tempo,
  budgets and break cadence are user-configurable in Settings.
- **`WebSocketWorldSource`** — activated by setting
  `NEXT_PUBLIC_PET_WS_URL`. Same interface, zero code changes.

### Live feed wire format

Push JSON frames over the WebSocket; each frame may carry either or both:

```jsonc
{ "event": { "type": "build:succeeded", "detail": "web", "at": 1720000000000 } }
{ "world": { "sessionTokens": 18420, "latencyMs": 148, "branch": "main" } }
```

`event.type` must be one of `DevEventType` (`src/companion-pet/types.ts`);
`world` is a partial `WorldSnapshot` merged into the current state.

### Connecting real developer tools

Any process that can open a WebSocket can feed the pet. Recipes:

- **Claude Code** — register [hooks](https://code.claude.com/docs) for tool
  events (`PostToolUse`, `Stop`, …) that POST to a tiny local relay which
  broadcasts `{event}` frames (map e.g. `Stop` → `ai:done`,
  `PostToolUse(Bash)` → `terminal:command`).
- **Git** — a `post-commit` / `post-push` hook that sends
  `{"event":{"type":"git:commit","detail":"<subject>"}}`.
- **Build/test watchers** — wrap `npm run build` / `vitest --watch` output;
  emit `build:started/succeeded/failed`, `tests:*`.
- **VS Code / Cursor / Codex-style tools** — an extension using
  `workspace.onDidSaveTextDocument`, task events and terminal APIs, mapped to
  `file:*`, `terminal:command`, `ai:*`.
- **System stats** — a Node script polling `os.cpus()` / `os.freemem()`,
  publishing partial `world` frames (`cpu`, `ram`, `online`).

The AI-provider layer (`src/lib/ai/`, used by `/companion`) is independent
and documented in `ENVIRONMENT.md`; a live integration can also derive
`ai:*` pet events from those adapters' streams.

## Emotion FSM

`EmotionEngine` (`emotions.ts`) is priority-based: a new emotion wins when
its priority ≥ the current one, or the current one has expired; each emotion
holds for `holdMs` then decays to its `fallback`. Emotions carry their cat
animation (`catMode`), entry action (jump/stretch/meow), sustained particles,
and a named `soundHook`.

19 emotions ship: idle, waiting, watching, focused, curious, playful,
thinking, happy, excited, celebrating, overheated, confused, surprised,
worried, sad, embarrassed, sleeping, stretching, greeting.

## Performance

- The cat canvas pauses entirely off-screen (IntersectionObserver) and caps
  device-pixel-ratio at 2.
- The simulator skips scenario work and heartbeats while `document.hidden`.
- Metric widgets are memoized on value text/ratio/tone — a snapshot update
  re-renders only widgets whose displayed value changed.
- `prefers-reduced-motion` (or the in-settings override) disables particles
  and engine locomotion.

## Settings & persistence

`petSettingsStore` (`settings.ts`) persists to
`localStorage["comnyang.pet.settings.v1"]` and applies every change
instantly via `useSyncExternalStore`. The Settings panel is generated from
the registries, so new metrics/reaction groups appear automatically.

## Environment variables

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_PET_WS_URL` | Switches the pet from the mock simulator to a live WebSocket feed (build-time var — rebuild/restart after changing) |
| AI provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, …) | Activate real chat providers for `/companion`; see `ENVIRONMENT.md` |

No keys are ever hardcoded; missing configuration always falls back to mock
mode.
