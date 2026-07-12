# Companion Engine

The living layer: procedural cat rendering + the behavior/emotion stack.
(Companion-pet registries: `COMPANION_PET.md`; voice: `VOICE_COMPANION.md`.)

## Procedural sprite renderer (`src/animations/pixel-cat/sprite.ts`)

No sprite sheets. The cat is drawn per-frame from parameterised poses on
a 24×22 logical cell grid, scaled with crisp pixels:

- Poses: `sit`, `walk` (side view, 4 legs with phase), `loaf` (sleep),
  `stretch`, `pounce` — plus continuous parameters: breathing squash,
  pupil offsets (eye tracking), blink, tail sway, knead phase, heat tint,
  mochi stretch.
- Six fur variants via `CAT_PALETTES` (orange, black, white, gray,
  brown, calico) with per-variant patch placement; add a variant by
  adding a palette entry.
- Eye styles: `open`, `happy` (^ ^ + blush), `closed`, `focus`.

## Behavior engine (`engine.ts`)

One `CatEngine` per canvas. Owns a rAF loop, behavior modes
(`sit/auto/eyes/hunt/drag/knead/overheat/stretch/sleep/think/celebrate/
walk/peek`), jump physics, pointer tracking, petting detection, and an
in-canvas particle system (hearts, zzz, steam, notes, sparkles).

Public API: `setMode`, `setVariant`, `setPointer`, `pet`, `tap`, `jump`,
`stretch`, `meow`, `emitParticles`, `setScale`, drag controls.

Performance: pauses entirely off-screen (IntersectionObserver),
devicePixelRatio capped at 2, `prefers-reduced-motion` zeroes locomotion.

## Emotion FSM (`src/companion-pet/emotions.ts`)

19 registered emotions map onto engine modes with priority-based
transitions: a new emotion wins when its priority ≥ current or the
current one expired; each holds for `holdMs` then decays to `fallback`.
Emotions carry entry actions (jump/stretch/meow), sustained particle
loops, and named sound hooks (dispatched as `pet:sound` CustomEvents
only when the user enables sounds).

## React wrapper (`src/components/pet/PixelCat.tsx`)

Canvas lifecycle, ResizeObserver sizing, pointer plumbing, and an
imperative handle exposing the engine. Everything above it (motion
demos, pet stage, voice panel) drives the same component.
