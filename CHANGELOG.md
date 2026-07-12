# Changelog

## 1.0.0 — 2026-07-12

### Landing recreation
- Full recreation of the reference landing page with original procedural
  pixel-cat art, original EN/KO copy, 17 live interactive motion demos,
  buy sections, sticky buy bar, smooth scrolling, loading screens,
  secondary pages (/showcase, /download, /reset-license).

### AI chat companion (/companion)
- Provider architecture (Claude / OpenAI / Gemini / mock) activated by
  env vars only; SSE streaming chat with retries and status indicators;
  simulated agent work-status feed (WebSocket-ready).

### AI Companion Pet (/pet)
- The cat as the interface: 19-emotion FSM, 38 event reactions,
  30+ toggleable metrics rendered as bubbles/signs/notes/widgets,
  9 personalities, XP/levels/achievements, mock dev-world simulator with
  WebSocket live mode, instant-apply persisted settings.

### Voice Companion (/pet)
- Streaming STT/TTS adapter layer (Web Speech + mock fallbacks),
  push-to-talk & hotkey, wake-word architecture, mic waveform + VAD,
  interruptible speech, floating markdown chat window (syntax
  highlighting, copy, expandable code), local tool router, persistent
  learning memory, premium capability flags.

### Production hardening (QA audit)
- Global error boundary + custom 404, security headers, robots/sitemap,
  metadataBase, dead-code removal, TTS text-cleanup fix, full
  documentation set (architecture, engine, plugins, API integration,
  customization, deployment, contributing).
