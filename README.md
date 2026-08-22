# AgentPaw — Recreation

A production-quality recreation of [comnyang.com/en](https://www.comnyang.com/en) —
a landing page for a pixel cat that lives on your desktop.

Built with **Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Lenis**.

> **Note on assets & copy** — no media or text was copied from the reference
> site. All pixel-cat artwork is procedural and rendered at runtime, and all
> copy is original writing. See [ASSETS.md](./ASSETS.md). Where the reference
> shows looping videos, this recreation ships **live interactive canvas
> demos** driven by a reusable cat animation engine.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other scripts: `npm run build` · `npm run lint` · `npm run typecheck` · `npm run format`.

## Desktop pet 🐈

The cat can live directly **on your desktop** — a transparent,
frameless, always-on-top window that floats over every app:

```bash
npm run dev       # terminal 1 — serves the app
npm run desktop   # terminal 2 — opens the pet (bottom-right corner)
```

Two modes, chosen with the `PET_MODE` env var:

- **`roam` (default)** — a click-through overlay covering the whole
  screen. The cat wanders along the bottom of your entire desktop; the
  overlay becomes clickable only while your pointer is near the cat
  (position reported over IPC), so it never blocks your work.
- **`corner`** — a small 300×340 draggable window in the bottom-right.
  ```bash
  PET_MODE=corner npm run desktop
  ```

Click the cat to make it jump · double-click to change fur ·
right-click to put it to sleep · hover it for the 🌙/✕ buttons ·
**Ctrl+Alt+Q** quits from anywhere. If the web app isn't running yet,
the window shows a retry screen until it appears. Implementation:
`desktop/main.js` + `desktop/preload.js` (Electron shell) and the bare
`/desktop` route.

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Layers, data flow, design decisions, security |
| [docs/COMPANION_ENGINE.md](./docs/COMPANION_ENGINE.md) | Procedural cat renderer + behavior engine + emotion FSM |
| [docs/COMPANION_PET.md](./docs/COMPANION_PET.md) | Pet registries, dev-world sources, live-feed wire format |
| [docs/VOICE_COMPANION.md](./docs/VOICE_COMPANION.md) | Voice pipeline, adapters, tools, memory, permissions |
| [docs/PLUGIN_GUIDE.md](./docs/PLUGIN_GUIDE.md) | Recipes for every extension point |
| [docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md) | Connecting real providers & backends |
| [docs/CUSTOMIZATION_GUIDE.md](./docs/CUSTOMIZATION_GUIDE.md) | Every user-facing setting |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Build, env, platform notes |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Every environment variable |
| [ASSETS.md](./ASSETS.md) | Asset policy (all original, nothing copied) |
| [CONTRIBUTING.md](./CONTRIBUTING.md) · [CHANGELOG.md](./CHANGELOG.md) | Workflow & history |

## AI Companion

`/companion` is a full AI companion workspace: chat with the cat (streaming
replies, typing indicator, retries, error banners), pick a provider, and watch
the cat react live to a feed of AI coding-agent work statuses (thinking →
thinking face, done → happy hop, error → overheat).

**It works end-to-end with mock data out of the box.** Add API keys to
`.env.local` (copy `.env.example`) and the matching provider goes **LIVE**
with zero code changes — see [ENVIRONMENT.md](./ENVIRONMENT.md) for the full
variable reference. Supported providers: **Claude (Anthropic)**, **OpenAI**,
**Gemini (Google)**, plus the offline **mock** provider.

- Adapters: `src/lib/ai/providers/*` (one module per provider, common
  `ChatProvider` interface; Anthropic + OpenAI use official SDKs, Gemini shows
  the raw-HTTP SSE pattern)
- Registry / env-driven activation: `src/lib/ai/registry.ts`
- Streaming API: `POST /api/chat` (SSE), provider status: `GET /api/providers`
- State: dependency-free `useSyncExternalStore` store (`src/lib/store/`)
- Event system: typed bus (`src/lib/events/bus.ts`) driving cat reactions
- Agent feed: simulator by default, real WebSocket via `NEXT_PUBLIC_AGENT_WS_URL`
  (`src/lib/agents/`)

## Architecture

```
src/
  app/                  # App Router pages (/, /companion, /download, /showcase, /reset-license)
    api/chat            #   SSE chat endpoint (provider streaming)
    api/providers       #   key-free provider status
  animations/
    pixel-cat/          # The cat system
      palettes.ts       #   fur variants (orange, black, white, gray, brown, mixed)
      sprite.ts         #   procedural pixel renderer (sit/walk/loaf/stretch/pounce)
      engine.ts         #   rAF behavior state machine + particles
    variants.ts         # shared Framer Motion variants
  components/
    layout/             # Header, Footer, StickyBuyBar, BackgroundFX
    sections/           # Hero, BuySection, MotionsSection (+ card data)
    pet/                # PixelCat (canvas wrapper), MotionDemo (17 demos), SpeechBubble
    providers/          # Lenis smooth-scroll provider
    ui/                 # PixelButton, PawLoader, CatLogo
  contexts/             # LanguageContext (EN/KO, persisted)
  hooks/                # usePrefersReducedMotion, usePlatform
  lib/                  # site config, i18n dictionaries
  styles/               # Tailwind v4 theme + retro FX (grid, scanlines, keyframes)
  types/  utils/
```

## The cat system

`CatEngine` (one per canvas) runs a behavior state machine over a procedural
pixel renderer — no sprite sheets. Supported behaviors: **idle / auto-roam /
walk / run-hunt / jump / sit / sleep / blink / tail sway / look left–right /
eye-follow / mochi-drag / knead / overheat / stretch / think / celebrate /
peek**, plus in-canvas particles (hearts, zzz, steam, notes, sparkles).
Six fur variants ship out of the box; add one by extending
`CAT_PALETTES`.

The engine pauses off-screen via `IntersectionObserver`, respects
`prefers-reduced-motion`, and caps devicePixelRatio at 2 for perf.

## Progress checklist

- [x] Project scaffold (Next 15, React 19, strict TS, Tailwind 4, ESLint 9 flat config, Prettier)
- [x] Design tokens matched to reference (colors, hard pixel shadows, grid bg, scanlines)
- [x] Header with language toggle (EN/KO) + mobile menu
- [x] Hero with staggered pixel title + live terminal-frame cat demo
- [x] Buy section (inverted card, corner accents, paw price loader, wobbling LAUNCH tag, coffee support option, live total, pulsing CTA, demo checkout)
- [x] 17 motion cards, each with a live interactive demo
- [x] Social links row + repeated bottom buy section
- [x] Sticky bottom buy bar (appears after hero, hides near buy/footer)
- [x] Footer (legal links, reset license, back-to-top)
- [x] /download (platform-aware CTAs), /showcase (variant gallery), /reset-license
- [x] Lenis smooth scrolling + anchor handling
- [x] i18n (EN/KO) persisted in localStorage
- [x] Reduced-motion support, keyboard focus styles, aria labels
- [x] Lint, typecheck and production build pass
- [x] AI companion page (/companion): streaming chat with the cat, provider picker, status indicators
- [x] Provider architecture: Claude / OpenAI / Gemini adapters + mock, env-var activation only
- [x] SSE streaming, loading states, error handling, auto-retry with backoff + manual retry
- [x] Typed event bus + store; cat reacts to chat & agent lifecycle events
- [x] Agent work-status feed (simulated by default, WebSocket-ready via env)
- [x] Environment documentation (.env.example, ENVIRONMENT.md)
- [x] Companion UI localized (EN/KO) like the rest of the site
- [x] Route-transition loading screen (bouncing paws), matching the reference loader
- [x] AI Companion Pet (/pet): the cat as the interface — 19-emotion FSM, 38 event reactions, 30+ toggleable metrics as bubbles/signs/notes/widgets, 9 personalities, XP/levels/achievements, instant-apply settings, mock simulator + WebSocket live mode (docs/COMPANION_PET.md)
- [x] Voice Companion (/pet): streaming STT/TTS with adapter layer + mock fallbacks, push-to-talk & hotkey, wake-word architecture, mic waveform/VAD, interruptible speech, floating markdown chat window (syntax highlighting, copy, expandable code), local tool router, persistent learning memory, premium flags (docs/VOICE_COMPANION.md)
- [x] Desktop pet (`npm run desktop`): transparent always-on-top Electron window — the cat floats over every app, draggable, interactive, with offline-retry screen
- [ ] Ship real download binaries / checkout (out of scope for a recreation)

## Notes on tech choices

- **GSAP** was deliberately omitted: Framer Motion covers declarative UI
  motion and the cat engine needs a raw rAF loop; adding GSAP would only
  grow the bundle ("only where appropriate" — it wasn't).
- The reference's proprietary display font is replaced with open-licensed
  VT323 served through `next/font` (zero layout shift, self-hosted).
