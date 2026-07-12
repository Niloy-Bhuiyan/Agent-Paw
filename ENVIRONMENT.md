# Environment variables

All AI credentials are supplied **exclusively through environment variables** —
there are no keys anywhere in the code, and `/api/providers` never exposes
secrets (it returns only `{ id, label, model, configured }`).

## Where to put them

| Context | File / mechanism |
| --- | --- |
| Local development | `.env.local` in the project root (copy from `.env.example`); restart `npm run dev` after edits |
| Production (Vercel etc.) | The platform's environment-variable settings |
| Self-hosted `next start` | Export in the shell / systemd unit / Docker env before starting |

`.env.local` is gitignored (`.env*`). Configuration is read from `process.env`
at **request time** on the server, so adding a key activates the real provider
without any code change.

## Reference

| Variable | Required | Default | Used by | Purpose |
| --- | --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | to enable Claude | — | server | Activates the Claude adapter (`src/lib/ai/providers/anthropic.ts`) |
| `ANTHROPIC_MODEL` | no | `claude-opus-4-8` | server | Claude model override |
| `OPENAI_API_KEY` | to enable OpenAI | — | server | Activates the OpenAI adapter |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | server | OpenAI model override |
| `OPENAI_BASE_URL` | no | official API | server | OpenAI-compatible gateway URL |
| `GOOGLE_API_KEY` (alias `GEMINI_API_KEY`) | to enable Gemini | — | server | Activates the Gemini adapter |
| `GOOGLE_MODEL` | no | `gemini-2.0-flash` | server | Gemini model override |
| `AI_DEFAULT_PROVIDER` | no | first configured, else `mock` | server | Which provider serves chats by default (`anthropic` \| `openai` \| `google` \| `mock`) |
| `AI_SYSTEM_PROMPT` | no | built-in cat persona | server | Override the companion persona |
| `AI_MAX_TOKENS` | no | `1024` | server | Reply token cap |
| `AI_MOCK_SIMULATE_ERRORS` | no | `false` | server | Mock provider randomly fails 25% of requests to demo the error/retry UI |
| `NEXT_PUBLIC_AGENT_WS_URL` | no | — (simulator) | client | WebSocket feed of real agent sessions, frames shaped `{"sessions": AgentSession[]}` (see `src/lib/agents/types.ts`). Build-time variable — rebuild after changing |
| `NEXT_PUBLIC_PET_WS_URL` | no | — (simulator) | client | Live dev-environment feed for the AI Companion Pet (`/pet`), frames shaped `{"event": DevEvent}` / `{"world": Partial<WorldSnapshot>}` — see `docs/COMPANION_PET.md`. Build-time variable — rebuild after changing |

## Behavior matrix

| State | What happens |
| --- | --- |
| No keys at all | Everything works on the mock provider + simulated agent feed |
| `ANTHROPIC_API_KEY` set | Claude appears as **LIVE** in the provider picker and becomes the default |
| Multiple keys set | All appear LIVE; `AI_DEFAULT_PROVIDER` (or first configured) is preselected; user can switch per conversation |
| Key removed | Provider reverts to **NO KEY** (disabled) on the next request; chats fall back to mock |
| Provider errors (429/5xx/network) | Client auto-retries up to 2× with exponential backoff, then shows a RETRY banner; SDKs also retry internally |
