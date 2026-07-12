import type { EmotionDef, EmotionId } from "@/companion-pet/types";

/* ============================================================
   Emotion registry + finite state machine.

   Each emotion maps to a cat-engine behavior, carries its own
   priority, hold time, decay target, particles and sound hook.
   Register new emotions with `registerEmotion()` — the FSM and
   UI pick them up automatically.
   ============================================================ */

const EMOTIONS = new Map<EmotionId, EmotionDef>();

export const registerEmotion = (def: EmotionDef): void => {
  EMOTIONS.set(def.id, def);
};

export const getEmotion = (id: EmotionId): EmotionDef =>
  EMOTIONS.get(id) ?? (EMOTIONS.get("idle") as EmotionDef);

const defs: EmotionDef[] = [
  { id: "idle", catMode: "auto", priority: 0, holdMs: Infinity, fallback: "idle" },
  { id: "waiting", catMode: "sit", priority: 1, holdMs: 8000, fallback: "idle" },
  { id: "watching", catMode: "eyes", priority: 2, holdMs: 6000, fallback: "idle", soundHook: "soft-blip" },
  { id: "focused", catMode: "eyes", priority: 3, holdMs: 10000, fallback: "watching" },
  { id: "curious", catMode: "walk", priority: 2, holdMs: 5000, fallback: "idle", soundHook: "soft-blip" },
  { id: "playful", catMode: "hunt", priority: 2, holdMs: 7000, fallback: "idle", particles: { kind: "note", every: 1800, count: 1 } },
  {
    id: "thinking",
    catMode: "think",
    priority: 4,
    holdMs: 20000,
    fallback: "waiting",
    soundHook: "hmm",
  },
  {
    id: "happy",
    catMode: "sit",
    priority: 3,
    holdMs: 4000,
    fallback: "idle",
    particles: { kind: "heart", every: 900, count: 1 },
    soundHook: "purr",
  },
  {
    id: "excited",
    catMode: "celebrate",
    priority: 5,
    holdMs: 3200,
    fallback: "happy",
    particles: { kind: "sparkle", every: 500, count: 2 },
    soundHook: "chirp",
    entry: "meow",
  },
  {
    id: "celebrating",
    catMode: "celebrate",
    priority: 6,
    holdMs: 4200,
    fallback: "happy",
    particles: { kind: "sparkle", every: 350, count: 2 },
    soundHook: "fanfare",
    entry: "jump",
  },
  {
    id: "overheated",
    catMode: "overheat",
    priority: 6,
    holdMs: 4500,
    fallback: "worried",
    particles: { kind: "steam", every: 400, count: 1 },
    soundHook: "sizzle",
  },
  {
    id: "confused",
    catMode: "sit",
    priority: 4,
    holdMs: 4000,
    fallback: "waiting",
    soundHook: "mrrp",
  },
  {
    id: "surprised",
    catMode: "sit",
    priority: 5,
    holdMs: 2500,
    fallback: "watching",
    soundHook: "gasp",
    entry: "jump",
  },
  {
    id: "worried",
    catMode: "sit",
    priority: 4,
    holdMs: 5000,
    fallback: "waiting",
    particles: { kind: "steam", every: 2200, count: 1 },
    soundHook: "mrrp-low",
  },
  {
    id: "sad",
    catMode: "sleep",
    priority: 4,
    holdMs: 6000,
    fallback: "idle",
    soundHook: "sigh",
  },
  {
    id: "embarrassed",
    catMode: "sit",
    priority: 4,
    holdMs: 3500,
    fallback: "idle",
    particles: { kind: "heart", every: 1600, count: 1 },
    soundHook: "mrrp",
  },
  {
    id: "sleeping",
    catMode: "sleep",
    priority: 1,
    holdMs: Infinity,
    fallback: "sleeping",
    particles: { kind: "zzz", every: 1500, count: 1 },
    soundHook: "snore",
  },
  {
    id: "stretching",
    catMode: "stretch",
    priority: 3,
    holdMs: 2600,
    fallback: "idle",
    soundHook: "yawn",
    entry: "stretch",
  },
  {
    id: "greeting",
    catMode: "celebrate",
    priority: 5,
    holdMs: 2800,
    fallback: "happy",
    particles: { kind: "heart", every: 600, count: 1 },
    soundHook: "chirp",
    entry: "meow",
  },
];

defs.forEach(registerEmotion);

/* ---------------- FSM ---------------- */

export interface EmotionChange {
  emotion: EmotionDef;
  previous: EmotionId;
  reason: string;
}

/**
 * Priority-based FSM: a new emotion wins if its priority is >= the current
 * one (or the current one has expired). Held emotions decay to their
 * fallback when their hold time elapses.
 */
export class EmotionEngine {
  private current: EmotionId = "idle";
  private enteredAt = Date.now();
  private decayTimer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<(change: EmotionChange) => void>();

  get currentId(): EmotionId {
    return this.current;
  }

  subscribe(listener: (change: EmotionChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Request a transition. Returns true if the transition happened. */
  set(id: EmotionId, reason = "event"): boolean {
    const next = getEmotion(id);
    const cur = getEmotion(this.current);
    const elapsed = Date.now() - this.enteredAt;
    const currentExpired = elapsed >= cur.holdMs;

    if (id !== this.current && next.priority < cur.priority && !currentExpired) return false;

    const previous = this.current;
    this.current = id;
    this.enteredAt = Date.now();
    this.scheduleDecay(next);
    for (const listener of this.listeners) listener({ emotion: next, previous, reason });
    return true;
  }

  private scheduleDecay(def: EmotionDef): void {
    clearTimeout(this.decayTimer);
    if (!Number.isFinite(def.holdMs)) return;
    this.decayTimer = setTimeout(() => {
      if (this.current === def.id) this.set(def.fallback, "decay");
    }, def.holdMs);
  }

  destroy(): void {
    clearTimeout(this.decayTimer);
    this.listeners.clear();
  }
}
