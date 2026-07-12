# API Integration Guide

How to connect every real backend. Nothing here is required — every
integration has a working mock default.

## AI providers (chat + voice replies)

Set env vars in `.env.local` (copy `.env.example`), restart dev.
Full variable table: `../ENVIRONMENT.md`.

| Provider | Vars | Notes |
| --- | --- | --- |
| Anthropic (Claude) | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL?` | Official SDK, streaming; default model `claude-opus-4-8` |
| OpenAI | `OPENAI_API_KEY`, `OPENAI_MODEL?` | Official SDK, streaming |
| OpenRouter | `OPENAI_API_KEY=<openrouter key>` + `OPENAI_BASE_URL=https://openrouter.ai/api/v1` | OpenAI-compatible |
| Local models (Ollama, LM Studio, llama.cpp) | `OPENAI_BASE_URL=http://localhost:11434/v1` + any `OPENAI_API_KEY` value + `OPENAI_MODEL=<local model>` | OpenAI-compatible endpoints |
| Google Gemini | `GOOGLE_API_KEY` (or `GEMINI_API_KEY`), `GOOGLE_MODEL?` | Raw SSE adapter |
| Custom | new adapter module | see `PLUGIN_GUIDE.md` |

Selection: `AI_DEFAULT_PROVIDER`, or per-conversation in the `/companion`
picker. Fallback chain: requested → configured default → mock.

## Server chat endpoint

`POST /api/chat` — body `{ provider?, messages: {role, content}[],
context? }`; responds `text/event-stream` with
`{type:"start"|"delta"|"done"|"error"}` frames. `context` is appended to
the system prompt (used for companion memory).

## Dev-environment feed (pet reactions + real metrics)

`NEXT_PUBLIC_PET_WS_URL` → WebSocket pushing
`{"event": DevEvent}` / `{"world": Partial<WorldSnapshot>}` frames.
Recipes for Claude Code hooks, git hooks, build watchers, editor
extensions and system-stat pollers: `COMPANION_PET.md`.

## Agent status feed (/companion page)

`NEXT_PUBLIC_AGENT_WS_URL` → frames `{"sessions": AgentSession[]}`
(`src/lib/agents/types.ts`).

## Voice

Browser-native (Web Speech) — no keys. Cloud STT/TTS: implement the
adapter interfaces (`PLUGIN_GUIDE.md`). Mic permission is requested on
first listen; denial falls back to typed input.

## Integrations without official browser APIs

| Wanted | Status | Supported alternative |
| --- | --- | --- |
| VS Code / Cursor internals | No browser API | Editor extension → WebSocket feed |
| Terminal / filesystem / git execution | Browsers can't execute | Local bridge daemon exposing tools over WS; swap mock `ToolDef.run` |
| Real CPU/RAM/battery | Not exposed to web pages | System poller script → `world` frames |
| Always-on wake word | No standard API | `WakeWordEngine` slot for a WASM keyword model |
| Cross-window/desktop pet | Web sandbox | Electron/Tauri wrapper (engine is portable) |
