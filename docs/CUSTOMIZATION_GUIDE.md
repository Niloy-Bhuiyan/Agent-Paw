# Customization Guide

Everything applies instantly and persists (localStorage). Open the pet's
Settings with the ⚙ button on `/pet`.

## Companion

| Setting | Options | Where |
| --- | --- | --- |
| Personality | Playful · Professional · Mentor · Teacher · Energetic · Calm · Sleepy · Curious · Chaotic | Settings → COMPANION |
| Fur variant | orange · black · white · gray · brown · mixed (calico) | Settings → COMPANION |
| Size | 30–65% of stage | slider |
| Position | left · center · right | Settings → COMPANION |
| Companion name / your name | free text (also learned from conversation) | Settings → MEMORY |

## Look & motion

Theme (midnight / terminal / paper), bubble style (pixel / round),
animation intensity (low / normal / high), particles on/off, sound hooks
on/off, force reduced motion, larger text.

## Behavior

Chattiness (reaction frequency 20–100%), sleep-after-idle minutes,
simulator tempo, time format (24h/12h), per-group reaction toggles
(AI, builds/tests, git, files, system, wellness, gamification).

## Displayed information

30+ metrics across four categories, each independently toggleable —
badges, progress bars, sparkline charts and notes orbit the pet.
Token budgets (daily/monthly) are user-defined and drive the budget bar
and low-budget warnings.

## Voice

STT/TTS provider (browser or mock), system voice picker, microphone
picker, speech rate, pitch, hotkey (single key), toggle vs hold-to-talk,
speak-replies, noise suppression, always-listening, wake word.

## Site-wide

Language (EN/한국어) in the header — persists; number/time formatting
follows it. `AI_SYSTEM_PROMPT` env var retunes the chat persona without
code changes.

## For developers

Design tokens live in `src/styles/globals.css` (`@theme`): colors,
pixel shadows, fonts. New themes = a `THEME_STAGE` entry in
`PetStage.tsx` + a `StageTheme` union member. Deeper extension points:
`PLUGIN_GUIDE.md`.
