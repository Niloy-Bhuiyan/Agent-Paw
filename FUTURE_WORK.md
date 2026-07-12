# FUTURE_WORK.md — The Honest State of This Project & The Road to "Better Than The Original"

This file is the complete, honest map: what exists today, what is real vs.
simulated, why the original's cat *looks* better than ours right now, and
the exact work — in order — that turns this from an impressive preview
into a finished product.

---

## PART 1 — What the project has TODAY

### Web version (localhost:3000 / deployable)

| Area | What exists | Real or simulated? |
| --- | --- | --- |
| Landing page (`/`) | Full recreation: hero with live cat, 17 interactive motion demos, buy cards, sticky bar, EN/KO, smooth scroll | Real UI; checkout/download buttons are stubs |
| Cat engine | Procedural pixel cat: 6 fur variants, 5 poses, eye tracking, blinking, tail, kneading, particles, jump physics | Real |
| Chat companion (`/companion`) | Streaming AI chat, provider picker, retries, agent panel | Chat real (mock cat by default, real AI with a key); agent feed **simulated** |
| AI Companion Pet (`/pet`) | 19-emotion FSM, 38 event reactions, 30+ metric widgets, 9 personalities, XP/achievements, full settings | Reactions/metrics driven by a **simulated** dev world (believable but fake data) |
| Voice Companion (`/pet`) | Real speech-in (Chrome/Edge), real speech-out, waveform, interruption, markdown replies, 8 voice tools, learning memory | Voice pipeline **real**; tool answers read the **simulated** world (except memory tools, which are real) |
| Providers | Claude / OpenAI / Gemini / OpenRouter / local models, env-activated | Real integrations; mock is the zero-config default |

### Desktop version (`npm run desktop`)

| Feature | Status |
| --- | --- |
| Transparent always-on-top window | ✅ Real |
| Roam mode: cat wanders the whole screen, click-through except near the cat | ✅ Real |
| Corner mode (small draggable window) | ✅ Real |
| Click jump / double-click fur / right-click sleep / idle chatter | ✅ Real |
| Reacting to what you're ACTUALLY doing (real builds, real git, real typing) | ❌ Not yet — this is the big one (Part 4, Phase B) |
| Installable .exe (works without `npm run dev`) | ❌ Not yet (Phase C) |

### The honest one-sentence status

> The **experience layer is finished** (animation, voice, UI, settings,
> architecture); the **data layer is simulated** — the pet performs a
> convincing show of watching you code, but it is not actually watching
> you yet, and the art is functional rather than beautiful.

---

## PART 2 — Why the original's cat looks better (and exactly how to beat it)

You are right that our cat feels "lightweight" next to theirs. This is
not a mystery — it is four concrete, fixable differences:

1. **Hand-drawn frames vs. rectangles.** Their cat is drawn by an artist,
   pixel by pixel, with a strong silhouette, rounded body shapes, ear
   angles, and personality in every frame. Ours is assembled from
   rectangles by code. Code-drawn art can be *good*, but it will never
   have the charm of hand-placed pixels.
2. **More animation frames.** Their motions have anticipation and
   follow-through (crouch before a jump, ears lag behind a head turn).
   Ours interpolates a few parameters smoothly — which reads as "floaty".
3. **Visual weight.** Theirs uses thicker outlines, stronger contrast,
   grounded shadows, and slightly chunkier proportions. Ours is thin.
4. **Snap.** Real pixel art moves on whole-pixel steps at a chunky scale.
   Ours moves on smooth sub-pixel curves — technically smoother, but it
   kills the retro "rigid" feel you noticed.

### The fix: the Art Overhaul (highest-impact work in this file)

**Important rule:** do NOT copy the original site's sprites — that art is
copyrighted. You draw (or commission) your own. The *style* is free to
work in; their exact drawings are not.

Concrete plan:

1. **Tooling:** Aseprite (~$20, the industry standard) or free Libresprite/Piskel.
2. **Canvas:** draw at 32×32 per frame (ours is ~24×22 logical cells).
   Chunkier = more presence.
3. **Sprite sheet spec** (this is your shopping list — each row is one
   animation, drawn for one cat, then recolored per variant):
   - Idle: 4 frames (breathe, ear flick on frame 3)
   - Blink: 2 frames
   - Sit-down / stand-up transition: 3 frames
   - Walk: 6 frames (this is where hand-drawn destroys procedural)
   - Run: 4 frames
   - Jump: 4 frames (crouch → launch → air → land-squash)
   - Sleep loaf: 4 frames (slow breathing)
   - Stretch: 5 frames
   - Knead: 4 frames
   - Pounce-crouch: 3 frames (butt wiggle!)
   - Happy / celebrate hop: 4 frames
   - Overheat: 3 frames
   - Total: ~46 frames × 6 palettes (palette swap is automated, not redrawn)
4. **Engine change (small!):** the renderer is one function. Add a
   `SpriteSheetRenderer` next to the procedural one in
   `src/animations/pixel-cat/` that blits frames from a PNG based on the
   same pose state the engine already computes. Everything above the
   renderer — emotions, reactions, voice, desktop — needs **zero changes**.
   Keep the procedural renderer as the fallback when no sheet is loaded.
5. **Rigidity fixes** (do these even before new art — one afternoon):
   - Snap all drawing to whole pixels (`Math.round` on cell positions,
     no fractional cell sizes) — instantly more "pixel-art".
   - Step animations on a timer (e.g. 8–12 fps frame ticks) instead of
     continuous easing for walk/tail — retro motion is *stepped*.
   - Thicken outlines to 1 full cell everywhere; raise palette contrast.
   - Darker, tighter ground shadow (2 cells tall, higher opacity).
   - Add 2–4 frame anticipation before the jump (crouch) and a landing
     squash — this alone changes the perceived weight completely.

Do items 5 first (code-only), then 1–4 (art). After that, side-by-side,
yours will not look "lighter" than theirs — and yours *moves* with
emotions, voice, and reactions theirs doesn't have on the web.

---

## PART 3 — Your cat question, answered precisely

**"Do I need to choose the cat, or does it appear automatically based on
what I'm doing?"**

There are two separate things people call "the cat", and they work
differently today:

| Thing | Today | Manual? | Automatic? |
| --- | --- | --- | --- |
| **Which cat (fur/appearance)** — orange, black, calico… | You choose: Settings → COMPANION → Fur, or double-click the desktop cat | ✅ Yes | ❌ Not yet (see below) |
| **What the cat does (behavior/emotion)** — thinking, celebrating, overheating, sleeping… | **Already automatic** — the emotion FSM picks behavior from events. On `/pet` those events are simulated; in voice chat they're real (it thinks when you ask, celebrates when done) | Partial (sleep toggle, chattiness, reaction groups) | ✅ Yes (with simulated/voice events) |

So: behavior is already automatic; appearance is manual by design (a pet's
look is identity — most users want to pick it once).

**Can appearance become automatic too? Yes — easily, in the future:**
- *Mood skins*: switch palette tint with emotion (redder when overheated
  — actually already happens; a sleepy gray-out is trivial to add).
- *Context cats*: a different variant per project/workspace, or per time
  of day (black cat at night). One `registerReaction`-style rule +
  `setVariant()` call — the API already exists.
- *Activity cats*: "Claude is generating → the focused gray cat appears;
  build fails → the dramatic orange one". Same mechanism.

**A true Manual Mode** (you pick the emotion/pose directly and it stays)
is not built yet but is one of the easiest future items: a
`behaviorMode: "auto" | "manual"` setting + an emotion picker that pins
the FSM. Listed in Phase F below.

**And the important nuance:** for the desktop cat to react to what you're
*actually* doing (real builds, real git, real typing speed), Phase B must
be built. The architecture (`DevWorldSource`) was designed for exactly
that — today it runs the simulator.

---

## PART 4 — The full roadmap to production (in order)

### Phase A — Art & Feel Overhaul  *(1–2 weeks; biggest visible win)*
- [ ] Code-only rigidity pass (whole-pixel snapping, stepped frame timing,
      thicker outlines, heavier shadow, jump anticipation/landing squash)
- [ ] Draw the sprite sheet (spec in Part 2) — your own original art
- [ ] `SpriteSheetRenderer` + loader; procedural stays as fallback
- [ ] Per-emotion ear/tail accents; 2–3 extra idle variations (grooming,
      scratching, looking around) so long idle never repeats visibly
- [ ] Sound pack (optional): 6–8 tiny retro SFX behind the existing
      `pet:sound` hooks (already wired, off by default)

### Phase B — Make it REAL (desktop watches your actual work)  *(1–2 weeks)*
This converts "preview" into "actually doing something".
- [ ] **Host bridge** in the Electron main process (it already runs Node,
      so no separate daemon needed): file watcher (chokidar) on chosen
      project folders → `file:*` events; `git` polling / hooks →
      `git:*` + real branch/commits; spawn-wrapped `npm run build/test`
      or log-file watchers → `build:*`, `tests:*`; `os` module →
      real CPU/RAM; `powerMonitor` → battery/idle; active-window title
      → "what you're working on"
- [ ] Feed these into the existing `WorldSnapshot`/`DevEvent` pipe
      (the WebSocket source already accepts exactly this shape)
- [ ] **Claude Code integration**: a hooks config that POSTs tool events
      to the bridge → the pet genuinely thinks while Claude thinks and
      hops when your task finishes (recipe stub in docs/COMPANION_PET.md)
- [ ] Real token metering: read usage from the provider responses in
      `/api/chat` (the fields are already in the SDK responses) instead
      of simulated counters

### Phase C — Desktop packaging (a real app, not a dev command)  *(3–5 days)*
- [ ] Embed the UI: `next build` static export of `/desktop` loaded from
      disk, so the pet runs **without** `npm run dev`
- [ ] `electron-builder` → installable `.exe` (and `.dmg`), app icon,
      tray icon with menu (change cat, sleep, settings, quit), optional
      launch-at-startup
- [ ] Multi-monitor: one overlay per display (or follow the active one)
- [ ] Settings window reachable from the tray (reuse the existing panel)

### Phase D — Web production deployment  *(2–3 days)*
- [ ] Deploy to Vercel; set `NEXT_PUBLIC_SITE_URL`; verify SSE streaming
- [ ] Demo GIF/video at the top of the README (recruiters watch, not read)
- [ ] OG share image; Lighthouse pass (target 95+; likely close already)
- [ ] If ever selling: real Lemon Squeezy/Stripe checkout + license API
      behind the existing buy buttons (they're stubs on purpose)

### Phase E — Engineering credibility  *(2–4 days)*
- [ ] Vitest unit tests: emotion FSM transitions, tool router intents,
      provider registry env logic, `speakableText`, memory learning
- [ ] Playwright smoke: each page renders, chat streams, settings persist
- [ ] GitHub Actions: typecheck + lint + test + build on every push
- [ ] Publish the repo (waiting only on your `gh auth login`)

### Phase F — Cat system upgrades  *(the fun list)*
- [ ] **Manual mode**: `behaviorMode` setting + emotion picker that pins
      the FSM (your request — easy)
- [ ] **Auto appearance rules**: variant by project / time of day /
      current activity (your request — the APIs exist)
- [ ] **Multi-cat**: `PET_COUNT` roaming together; they already can't
      collide since each is an independent engine; add simple "notice
      each other" behavior for charm; ties into the `multiCompanion`
      premium flag
- [ ] New species via the renderer interface (dog/duck/blob — engine is
      species-agnostic above the draw layer)
- [ ] Cat-to-cat chatter (two pets exchange speech bubbles)

### Phase G — Voice & AI upgrades
- [ ] Provider-native tool calling (Anthropic tool use) bridged into the
      existing tool registry → the AI itself can trigger real tools
- [ ] Cloud TTS adapter (natural voices) + cloud STT adapter — slots exist
- [ ] Real wake word: WASM keyword model behind the `WakeWordEngine`
      interface (no browser API exists; this is the supported path)
- [ ] Conversation summarization into memory (long-term memory that
      survives beyond the rolling 40 turns)

### Phase H — Premium backend (only if you productize)
- [ ] Entitlement API behind the existing premium flags
- [ ] Cloud sync of settings/memory; personality-pack downloads
      (runtime `registerPersonality` already works — needs hosting)

---

## PART 5 — Definition of "finished / better than the original"

Check these and you are objectively past the reference:

- [ ] The cat is hand-drawn, weighty, snappy (Phase A) — matches their art
- [ ] The desktop pet reacts to YOUR real builds/git/typing (Phase B) —
      their product does this; ours must too, and ours adds voice
- [ ] Installable .exe, no dev server (Phase C) — same convenience as theirs
- [ ] Live at a public URL with a demo video (Phase D)
- [ ] CI green, tests exist (Phase E) — engineering proof they don't show
- [ ] Everything current already exceeds them: voice conversations,
      AI chat, 9 personalities, plugin registries, metrics, achievements,
      full customization, open architecture

**Recommended order:** A → B → C → E → D → F → G (A and B change how it
*feels* and what it *is*; the rest polish and prove it).

---

*Reminder to self: never copy the original site's art or text — original
work only (see ASSETS.md). Everything in this repo so far is original.*
