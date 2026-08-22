<div align="center">

# 🐾 AgentPaw

### A pixel cat that lives on your desktop

[![Typing SVG](https://readme-typing-svg.demolab.com?font=VT323&size=22&pause=1200&color=F7B32B&center=true&vCenter=true&width=520&lines=Watches+your+cursor.;Kneads+while+you+type.;Reacts+to+your+AI+agents.;Nudges+you+to+stretch.)](https://git.io/typing-svg)

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-EF008F?style=flat-square&logo=framer&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-2B2E3A?style=flat-square&logo=electron&logoColor=white)

</div>

---

A production-quality recreation of [comnyang.com/en](https://www.comnyang.com/en): a landing page for a pixel cat that lives on your desktop, extended with a full AI companion, a voice pipeline, and a real desktop pet window.

> **On assets and copy:** nothing was copied from the reference site. Every cat sprite is procedural and rendered at runtime, and every line of copy is original writing. Where the reference shows looping videos, this project ships **live interactive canvas demos** instead. Details in [ASSETS.md](./ASSETS.md).

## 📋 Contents

- [Quick start](#-quick-start)
- [Desktop pet](#-desktop-pet)
- [AI Companion](#-ai-companion)
- [Architecture](#-architecture)
- [The cat system](#-the-cat-system)
- [Documentation](#-documentation)
- [Progress checklist](#-progress-checklist)
- [Tech notes](#-tech-notes)

## 🚀 Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

| Script | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |

## 🖥️ Desktop pet

The cat can live directly on your desktop: a transparent, frameless, always-on-top window that floats over every app.

```bash
npm run dev       # terminal 1: serves the app
npm run desktop   # terminal 2: opens the pet
```

Two modes via the `PET_MODE` env var:

| Mode | Behavior |
| --- | --- |
| `roam` (default) | A click-through overlay covering the whole screen. The cat wanders along the bottom of your entire desktop; the overlay only becomes clickable while your pointer is near the cat, tracked over IPC, so it never blocks your work. |
| `corner` | A small 300×340 draggable window in the bottom-right. Run with `PET_MODE=corner npm run desktop`. |

**Controls:** click to jump · double-click to change fur · right-click for the menu (sleep, fur, quit) · hover for the 🌙/✕ buttons · `Ctrl+Alt+Q` quits from anywhere.

If the web app isn't running yet, the window shows a retry screen until it appears. Implementation: `desktop/main.js` + `desktop/preload.js` (Electron shell) and the bare `/desktop` route.

## 🤖 AI Companion

`/companion` is a full AI companion workspace: chat with the cat (streaming replies, typing indicator, retries, error banners), pick a provider, and watch the cat react live to a feed of AI coding-agent work statuses (thinking → thinking face, done → happy hop, error → overheat).

**Works end-to-end with mock data out of the box.** Add API keys to `.env.local` (copy `.env.example`) and the matching provider goes live with zero code changes. Full variable reference in [ENVIRONMENT.md](./ENVIRONMENT.md).

**Supported providers:** Claude (Anthropic) · OpenAI · Gemini (Google) · offline mock

| Piece | Where |
| --- | --- |
| Provider adapters | `src/lib/ai/providers/*` (one module per provider, common `ChatProvider` interface) |
| Registry / env activation | `src/lib/ai/registry.ts` |
| Streaming API | `POST /api/chat` (SSE) |
| Provider status | `GET /api/providers` |
| State | dependency-free `useSyncExternalStore` store, `src/lib/store/` |
| Events | typed bus, `src/lib/events/bus.ts`, drives cat reactions |
| Agent feed | simulator by default, real WebSocket via `NEXT_PUBLIC_AGENT_WS_URL`, `src/lib/agents/` |

## 🗂️ Architecture

```
src/
  app/                  App Router pages (/, /companion, /download, /showcase, /reset-license)
    api/chat            SSE chat endpoint (provider streaming)
    api/providers        key-free provider status
  animations/
    pixel-cat/           The cat system
      palettes.ts         fur variants (orange, black, white, gray, brown, mixed)
      sprite.ts           procedural pixel renderer (sit/walk/loaf/stretch/pounce)
      engine.ts           rAF behavior state machine + particles
    variants.ts          shared Framer Motion variants
  components/
    layout/              Header, Footer, StickyBuyBar, BackgroundFX
    sections/             Hero, BuySection, MotionsSection (+ card data)
    pet/                 PixelCat (canvas wrapper), MotionDemo (17 demos), SpeechBubble
    providers/            Lenis smooth-scroll provider
    ui/                  PixelButton, PawLoader, CatLogo
  contexts/               LanguageContext (EN/KO, persisted)
  hooks/                 usePrefersReducedMotion, usePlatform
  lib/                    site config, i18n dictionaries
  styles/                Tailwind v4 theme + retro FX (grid, scanlines, keyframes)
  types/  utils/
```

## 🐱 The cat system

`CatEngine` (one per canvas) runs a behavior state machine over a procedural pixel renderer. No sprite sheets.

**Behaviors:** idle · auto-roam · walk · run-hunt · jump · sit · sleep · blink · tail sway · look left-right · eye-follow · mochi-drag · knead · overheat · stretch · think · celebrate · peek, plus in-canvas particles (hearts, zzz, steam, notes, sparkles).

Six fur variants ship out of the box. Add one by extending `CAT_PALETTES`.

The engine pauses off-screen via `IntersectionObserver`, respects `prefers-reduced-motion`, and caps devicePixelRatio at 2 for performance.

## 📚 Documentation

| Doc | Contents |
| --- | --- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Layers, data flow, design decisions, security |
| [docs/COMPANION_ENGINE.md](./docs/COMPANION_ENGINE.md) | Procedural cat renderer, behavior engine, emotion FSM |
| [docs/COMPANION_PET.md](./docs/COMPANION_PET.md) | Pet registries, dev-world sources, live-feed wire format |
| [docs/VOICE_COMPANION.md](./docs/VOICE_COMPANION.md) | Voice pipeline, adapters, tools, memory, permissions |
| [docs/PLUGIN_GUIDE.md](./docs/PLUGIN_GUIDE.md) | Recipes for every extension point |
| [docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md) | Connecting real providers and backends |
| [docs/CUSTOMIZATION_GUIDE.md](./docs/CUSTOMIZATION_GUIDE.md) | Every user-facing setting |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Build, env, platform notes |
| [docs/AUDIT_REPORT.md](./docs/AUDIT_REPORT.md) | Codebase audit findings |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Every environment variable |
| [ASSETS.md](./ASSETS.md) | Asset policy: all original, nothing copied |
| [FUTURE_WORK.md](./FUTURE_WORK.md) | Honest status, art-overhaul plan, production roadmap |
| [GUIDE.md](./GUIDE.md) | Complete setup guide, written for a fresh machine |
| [CONTRIBUTING.md](./CONTRIBUTING.md) · [CHANGELOG.md](./CHANGELOG.md) | Workflow and history |

## ✅ Progress checklist

<details>
<summary><strong>Click to expand full checklist</strong></summary>

- [x] Project scaffold (Next 15, React 19, strict TS, Tailwind 4, ESLint 9 flat config, Prettier)
- [x] Design tokens matched to reference (colors, hard pixel shadows, grid bg, scanlines)
- [x] Header with language toggle (EN/KO) and mobile menu
- [x] Hero with staggered pixel title and live terminal-frame cat demo
- [x] Buy section: inverted card, corner accents, paw price loader, wobbling LAUNCH tag, coffee support option, live total, pulsing CTA, demo checkout
- [x] 17 motion cards, each with a live interactive demo
- [x] Social links row and repeated bottom buy section
- [x] Sticky bottom buy bar (appears after hero, hides near buy/footer)
- [x] Footer: legal links, reset license, back-to-top
- [x] `/download` (platform-aware CTAs), `/showcase` (variant gallery), `/reset-license`
- [x] Lenis smooth scrolling and anchor handling
- [x] i18n (EN/KO) persisted in localStorage
- [x] Reduced-motion support, keyboard focus styles, aria labels
- [x] Lint, typecheck and production build pass
- [x] AI companion page (`/companion`): streaming chat with the cat, provider picker, status indicators
- [x] Provider architecture: Claude / OpenAI / Gemini adapters plus mock, env-var activation only
- [x] SSE streaming, loading states, error handling, auto-retry with backoff plus manual retry
- [x] Typed event bus and store; cat reacts to chat and agent lifecycle events
- [x] Agent work-status feed (simulated by default, WebSocket-ready via env)
- [x] Environment documentation (`.env.example`, `ENVIRONMENT.md`)
- [x] Companion UI localized (EN/KO) like the rest of the site
- [x] Route-transition loading screen (bouncing paws), matching the reference loader
- [x] AI Companion Pet (`/pet`): the cat as the interface, 19-emotion FSM, 38 event reactions, 30+ toggleable metrics as bubbles/signs/notes/widgets, 9 personalities, XP/levels/achievements, instant-apply settings, mock simulator plus WebSocket live mode
- [x] Voice Companion (`/pet`): streaming STT/TTS with adapter layer and mock fallbacks, push-to-talk and hotkey, wake-word architecture, mic waveform/VAD, interruptible speech, floating markdown chat window (syntax highlighting, copy, expandable code), local tool router, persistent learning memory, premium flags
- [x] Desktop pet (`npm run desktop`): transparent always-on-top Electron window, the cat floats over every app, draggable, interactive, native right-click menu, offline-retry screen
- [ ] Ship real download binaries / checkout (out of scope for a recreation)

</details>

## 🧠 Tech notes

- **GSAP was deliberately omitted.** Framer Motion covers declarative UI motion and the cat engine needs a raw rAF loop; adding GSAP would only grow the bundle for no gain.
- The reference site's proprietary display font is replaced with open-licensed **VT323**, served through `next/font` (zero layout shift, self-hosted).

<div align="center">

**Built for study purposes.** No affiliation with the original comnyang.com.

</div>
