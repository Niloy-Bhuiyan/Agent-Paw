# QA & Production Readiness Audit — 2026-07-12

Method: line-level code inspection, automated sweeps (dead exports, debug
logs, type escapes), full typecheck/lint/build, and runtime testing of
every route, the 404 path, security headers, and SSE streaming on the
production build. All checks pass.

## Fixes applied during this audit

| Issue found | Severity | Fix |
| --- | --- | --- |
| No global error boundary — an unhandled render error showed the framework default | Med | `src/app/error.tsx` (overheating cat + reset) |
| No custom 404 | Low | `src/app/not-found.tsx` (sleeping cat) |
| No security headers | Med | nosniff, frame-deny, referrer-policy, permissions-policy in `next.config.ts` |
| No robots.txt / sitemap.xml / `metadataBase` | Low | `robots.ts`, `sitemap.ts`, `NEXT_PUBLIC_SITE_URL` |
| `speakableText` stripped hyphens inside words (TTS read "type-safe" wrong) | Low | markers stripped per-line-start / emphasis-pair only |
| Dead exports: `MotionCardData`, `PixelLink`, `SttResultHandler`; unused `marquee` keyframe | Low | removed |
| Docs incomplete vs. spec | Med | 8 new docs (architecture, engine, plugins, API, customization, deployment, contributing, changelog) |

## Feature completion checklist

**Landing recreation** — ✅ hero (live cat demo) · ✅ buy cards (price
paws, coffee option, pulsing CTA) · ✅ 17 motion cards (all live &
interactive) · ✅ sticky buy bar · ✅ header/footer/lang toggle ·
✅ smooth scroll (Lenis) · ✅ loading screen · ✅ secondary pages ·
🟡 locales: EN+KO (reference has 4) · 🟡 showcase: gallery only
(reference has community uploads/votes — needs a backend) ·
❌ real checkout/downloads (intentional demo stubs).

**AI providers** — ✅ Claude · ✅ OpenAI · ✅ Gemini · ✅ OpenRouter &
local models (via `OPENAI_BASE_URL`) · ✅ mock · ✅ env-only activation ·
✅ streaming, retries, typed errors · ✅ custom-provider extension point.

**Companion Pet** — ✅ 19-emotion FSM · ✅ 38 event reactions ·
✅ 30+ metrics (independently toggleable, styled, placed, rate-limited) ·
✅ 9 personalities · ✅ XP/levels/achievements · ✅ mock world simulator ·
✅ WebSocket live mode · ✅ settings (instant, persisted) ·
✅ reduced-motion + off-screen pausing.

**Voice Companion** — ✅ streaming STT (browser) + mock ·
✅ TTS (voice/rate/pitch, interrupt/resume) + mock · ✅ waveform + VAD ·
✅ hotkey, toggle & hold-to-talk · ✅ always-listening + wake word
(transcript matcher; real keyword-spotting model is a documented slot) ·
✅ markdown window (tables, links, highlighted & expandable code, copy) ·
✅ tool router (8 tools; memory tools real, others mock) · ✅ learning
memory · ✅ premium flags (architecture-ready, inert without backend) ·
❌ images in chat (listed as "later" in spec; renderer supports adding it).

**Platform** — ✅ error boundary · ✅ custom 404 · ✅ security headers ·
✅ robots/sitemap · ✅ a11y pass (focus styles, aria labels, roles,
reduced motion, large text option) · ✅ responsive (mobile shelf replaces
widget rails; all pages fluid) · ❌ automated test suite (recommended
next step) · ❌ git history (project not yet its own repo).

## Honest comparison vs. the reference

| Category | Winner | Why |
| --- | --- | --- |
| Animation | **Ours** | Live interactive canvas demos + FSM vs. looping videos; but their hand-drawn frames have artisanal charm ours approximates procedurally |
| Visual design | **Reference (slightly)** | Same design language, but their custom font & bespoke pixel art are more distinctive than VT323 + procedural sprites |
| Loading experience | Tie | Both use paw loaders; ours adds route-level boundaries |
| Responsiveness | Tie | Both solid; ours adds ultra-wide handling |
| Performance | **Ours (measured)** | Static prerender, 101–220 kB first-load, engines pause off-screen; theirs ships multiple MP4s |
| Accessibility | **Ours** | Reduced-motion, aria labels, focus-visible outlines, large-text option; reference relies on videos without equivalents |
| Architecture / DX | **Ours** | Registries, adapters, strict TS, docs — the reference is a marketing page, so this is expected, not a boast |
| Pet/Voice/AI/plugins/premium | **Ours** | These don't exist on the reference (they live in the desktop app, which we don't have access to) |
| Overall polish | **Reference (slightly)** on the landing page craft; **ours** overall | Their single page is extremely honed; our project does far more at high quality |

## Production readiness verdict

**Ready to deploy as a demo/showcase product today** (mock-first design
is intentional). For a *commercial* launch you would still need: real
checkout + license backend, download binaries, community showcase
backend, an automated test suite, and a git history with CI. Rough
completion vs. everything specified across all prompts: **~92%** — the
remaining 8% is items that require backends, native APIs, or explicit
future-scope ("images later", downloadable pack distribution,
desktop-only behaviors like walking across monitors).
