# Plugin Guide

Every companion subsystem is a registry. A plugin is a module that calls
one or more `register*()` functions at import time — no core edits, and
the Settings UI picks new entries up automatically.

## Recipes

### New emotion
```ts
import { registerEmotion } from "@/companion-pet/emotions";
registerEmotion({
  id: "zoomies" as EmotionId, // extend the union in types.ts for full typing
  catMode: "hunt", priority: 5, holdMs: 4000, fallback: "playful",
  particles: { kind: "sparkle", every: 300, count: 2 }, entry: "jump",
});
```

### New reaction (event → emotion + dialogue + XP)
```ts
import { registerReaction } from "@/companion-pet/reactions";
registerReaction({
  event: "deploy:succeeded" as DevEventType, group: "build-test",
  emotion: "celebrating", dialogueKey: "deploy.ok", bubble: "speech",
  particles: { kind: "sparkle", count: 10 }, xp: 20,
});
```

### New metric (auto-appears in Settings + widget rails)
```ts
import { registerMetric } from "@/companion-pet/metrics";
registerMetric({
  id: "dev.prOpen", category: "dev", label: "Open PRs", icon: "🔀",
  style: "badge", defaultEnabled: false, updateMs: 5000,
  read: (world) => ({ text: `${world.commitsToday} open` }),
});
```

### New personality / dialogue pack
```ts
import { registerPersonality } from "@/companion-pet/dialogue";
registerPersonality("pirate" as PersonalityId, {
  "build.succeeded": ["The build sails true, cap'n!"],
});
```
Unknown keys fall back to the playful pack, so packs can be partial.
This is also the "downloadable personality pack" mechanism: fetch JSON,
call `registerPersonality` at runtime.

### New voice tool
```ts
import { registerTool } from "@/companion-pet/tools";
registerTool({
  id: "open-pr", label: "Open PR", description: "Opens a pull request",
  intents: [/open (a )?pull request/i], mock: false,
  run: async (utterance, { world }) => callYourBackend(utterance, world),
});
```

### New AI provider
Implement `ChatProvider` (`src/lib/ai/types.ts`) in
`src/lib/ai/providers/<name>.ts`, add it to the `PROVIDERS` array in
`registry.ts`, gate `isConfigured()` on your env var. Done — it appears
in `/api/providers`, the companion picker, and voice replies.

### New STT/TTS adapter
Implement `SttAdapter`/`TtsAdapter` (`src/companion-pet/voice/types.ts`)
and add a case in `createRecognizer`/`createSynth`.

### New achievement
`registerAchievement()` in `src/companion-pet/achievements.ts`.

### New pet species
The upstream systems only know `catMode` strings and the `PixelCat`
component. Either extend the sprite renderer with new pose functions, or
swap `PixelCat` in `PetStage` for another renderer honoring the same
props (`mode`, `variant`, `scale`, imperative particle/jump API).

### New dev-environment integration
Implement `DevWorldSource` (`src/companion-pet/types.ts`) or push frames
to the WebSocket source — wire format in `COMPANION_PET.md`.

### Sound pack
```ts
window.addEventListener("pet:sound", (e) => {
  const { hook } = (e as CustomEvent<{ hook: string }>).detail;
  myAudioSprite.play(hook); // hooks: purr, chirp, fanfare, sizzle, yawn…
});
```
Fires only when Settings → sounds is enabled.
