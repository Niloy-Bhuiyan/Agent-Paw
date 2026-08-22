# AI Companion Voice Pet — guide

The voice companion lives on **`/pet`**, layered onto the companion-pet
system (`docs/COMPANION_PET.md`). Click the 🎤 button, press the hotkey
(default **V**), or type into the mock-mic field — the pet listens,
thinks, answers in a floating markdown window, and speaks the reply.

## Conversation pipeline

```
        hotkey / click / wake word
                 │
   STT adapter (streaming interim results)
                 │ final transcript
   memory.learnFromUtterance()  ── learns names & goals
                 │
   Tool router (local intents) ──match──▶ instant local reply
                 │ no match
   POST /api/chat (SSE) + memoryContext() ──▶ provider registry
                 │ streaming deltas          (mock → live via env keys)
   Floating chat window (markdown, code, copy)
                 │
   TTS adapter speaks (interruptible) + emotion FSM animates
```

Phases: `idle → listening → transcribing → thinking → responding →
speaking`, with interruption from any phase (click 🎤 again, press STOP,
or just start talking — speaking to the pet cancels its speech).

## Voice adapters

| Layer | Adapter | Needs | Fallback |
| --- | --- | --- | --- |
| Speech-to-text | `WebSpeechRecognizer` (browser engine, streaming interim results) | Chrome/Edge + mic permission | `MockRecognizer` — a "type what you'd say" field that simulates word-by-word interim results |
| Text-to-speech | `WebSpeechSynth` (browser `speechSynthesis`, voice/rate/pitch) | any modern browser | `MockSynth` — silent but time-accurate (boundaries + end events), so animations/interruption behave identically |
| Mic metering | `MicMeter` (getUserMedia + AnalyserNode → waveform + adaptive VAD) | mic permission | synthetic waveform |
| Wake word | `TranscriptWakeMatcher` (matches the phrase in streaming transcripts) | always-listening mode | — |

New adapters (cloud STT/TTS, natural voices, local models) plug into the
factories in `src/companion-pet/voice/stt.ts` / `tts.ts` — implement
`SttAdapter` / `TtsAdapter` and add a case; the orchestrator and UI are
adapter-agnostic. A true always-on wake word needs a local keyword-spotting
model; the `WakeWordEngine` interface in `wakeword.ts` is the slot for it.

## AI providers

Replies go through the same provider layer as `/companion`
(`src/lib/ai/`): **mock by default; Anthropic / OpenAI / Gemini activate
via environment variables with zero code changes** (see `ENVIRONMENT.md`).
OpenRouter and other OpenAI-compatible gateways work today via
`OPENAI_BASE_URL` + `OPENAI_API_KEY`; local models (Ollama, LM Studio,
llama.cpp servers) the same way — point `OPENAI_BASE_URL` at the local
server. A fully custom provider = one new adapter module in
`src/lib/ai/providers/` registered in `registry.ts`.

The voice pet also sends `memoryContext()` (companion name, user name,
goals, achievements) as `context` — appended server-side to the system
prompt so live providers personalize replies.

## Tool system

`src/companion-pet/tools/index.ts` — a registry of `ToolDef`s with intent
regexes. The router answers matching utterances locally before any
provider call. Try saying/typing:

- "how many tokens today?" · "git status" · "are tests passing?"
- "how long have I been coding?" · "what project is this?"
- "search for TODO" · "remind me to refactor the engine" · "what are my goals?"

Built-ins are mock (they read the simulated world) except the memory
tools, which really persist. Real file/terminal/git/browser tools need a
host bridge (a local server or extension executing the action) plus,
ideally, provider tool-calling — the `ToolDef.run` signature stays the
same, so swapping a mock for a real backend touches only that tool.

## Memory

`src/companion-pet/memory.ts`, persisted to
`localStorage["agentpaw.pet.memory.v1"]`: companion name, your name,
goals, achievements, streaks, conversation history (rolling 40 turns),
greeting counts, favorites. It **learns from conversation** — "my name is
Ana", "call me Sam", "remind me to ship v2", "I'll call you Mochi" are
picked up automatically. Manage or wipe everything in Settings → MEMORY.

## Settings (all instant, all persisted)

Settings → **VOICE**: STT/TTS provider, browser voice picker, microphone
picker, rate, pitch, hotkey, toggle vs push-to-talk (hold), speak-replies,
noise suppression, always-listening, wake word. Plus everything from the
base pet: personality (now including **Mentor** and **Teacher**), scale,
position, themes, bubble styles, particles, reaction groups, metrics,
budgets, accessibility (reduced motion, large text).

## Premium architecture

Settings → **PREMIUM** holds capability flags (`multiCompanion`,
`naturalVoices`, `cloudMemory`, `marketplace`) behind a master switch.
They're wired into the settings store so premium backends can gate on
them; with no backend they are inert — the companion never degrades.
Suggested wiring: a `PremiumGate` service that checks the flag + an
entitlement endpoint, falling back to local behavior when absent.

## Environment variables

No new required variables. Relevant ones (all documented in
`ENVIRONMENT.md` / `.env.example`):

| Variable | Effect on the voice pet |
| --- | --- |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` | Voice replies come from the real model instead of the mock cat |
| `OPENAI_BASE_URL` | Route the OpenAI adapter to OpenRouter / Ollama / any compatible gateway |
| `AI_SYSTEM_PROMPT`, `AI_MAX_TOKENS`, `AI_DEFAULT_PROVIDER` | Same semantics as `/companion` |
| `NEXT_PUBLIC_PET_WS_URL` | Live dev-events feed (tools then report real build/git/token data) |

## Permissions

| Capability | Permission | If denied |
| --- | --- | --- |
| Real speech recognition | Microphone (browser prompt on first listen) | Mock recognizer (typed input) keeps everything working |
| Waveform/VAD | Microphone | Synthetic waveform |
| Speech output | none (built-in synthesis) | Mock synth (silent, timed) |
| Persistence | localStorage | In-memory for the session |

## Roadmap

- Provider-native tool calling (Anthropic tool use) bridged to the tool registry
- Local wake-word model behind `WakeWordEngine`
- Cloud STT/TTS adapters (natural voices) behind the same factories
- Host bridge (small local daemon) for real file/git/terminal tools
- Multi-companion rendering (the cat engine already supports N instances)
- Downloadable personality/dialogue packs (`registerPersonality` at runtime)
