import type { CatMode } from "@/types";

/* ============================================================
   AI Companion Pet — core types
   Every registry (emotions, reactions, metrics, dialogue) is
   keyed by plain string ids so plugins can extend them.
   ============================================================ */

export type EmotionId =
  | "idle"
  | "happy"
  | "excited"
  | "focused"
  | "thinking"
  | "watching"
  | "curious"
  | "confused"
  | "sleeping"
  | "celebrating"
  | "overheated"
  | "embarrassed"
  | "surprised"
  | "worried"
  | "sad"
  | "playful"
  | "stretching"
  | "greeting"
  | "waiting";

export type ParticleKind = "heart" | "zzz" | "steam" | "note" | "sparkle";

export interface EmotionDef {
  id: EmotionId;
  /** Which cat-engine behavior renders this emotion. */
  catMode: CatMode;
  /** Higher priority interrupts lower; equal priority replaces. */
  priority: number;
  /** How long the emotion holds before decaying to `fallback` (ms). */
  holdMs: number;
  fallback: EmotionId;
  particles?: { kind: ParticleKind; every?: number; count?: number };
  /** Named audio cue for future sound packs. Sounds are OFF by default. */
  soundHook?: string;
  /** One-shot engine action fired on entry. */
  entry?: "jump" | "stretch" | "meow";
}

/* ---------------- Dev events ---------------- */

export type DevEventType =
  | "ai:generating"
  | "ai:streaming"
  | "ai:done"
  | "ai:long-thinking"
  | "ai:large-response"
  | "code:accepted"
  | "code:rejected"
  | "build:started"
  | "build:succeeded"
  | "build:failed"
  | "lint:errors"
  | "tests:running"
  | "tests:passed"
  | "tests:failed"
  | "git:commit"
  | "git:push"
  | "git:pull"
  | "index:started"
  | "index:done"
  | "terminal:command"
  | "pkg:installing"
  | "pkg:installed"
  | "file:created"
  | "file:deleted"
  | "file:renamed"
  | "search:running"
  | "refactor:running"
  | "sys:high-cpu"
  | "sys:high-memory"
  | "sys:low-battery"
  | "net:offline"
  | "net:online"
  | "user:idle"
  | "user:active"
  | "user:long-session"
  | "user:break-reminder"
  | "user:greeting"
  | "goal:daily-achieved"
  | "achievement:unlocked";

export interface DevEvent {
  type: DevEventType;
  /** Short human detail, e.g. a file name or command. */
  detail?: string;
  /** Numeric payload where meaningful (tokens, %, ms...). */
  value?: number;
  at: number;
}

/* ---------------- Reactions ---------------- */

/** Reaction groups the user can toggle in Settings. */
export type ReactionGroup =
  | "ai"
  | "build-test"
  | "git"
  | "files"
  | "system"
  | "wellness"
  | "gamification";

export interface ReactionDef {
  event: DevEventType;
  group: ReactionGroup;
  emotion: EmotionId;
  /** Dialogue key looked up in the active personality pack. */
  dialogueKey: string;
  bubble: "speech" | "thought" | "sign" | "note" | "none";
  particles?: { kind: ParticleKind; count: number };
  /** Awarded XP when this event fires. */
  xp?: number;
}

/* ---------------- Metrics ---------------- */

export type MetricCategory = "ai" | "dev" | "perf" | "productivity";
export type MetricStyle = "badge" | "bar" | "chart" | "note";

export interface MetricValue {
  text: string;
  /** For bars: 0..1 fill. */
  ratio?: number;
  /** For sparkline charts. */
  series?: number[];
  /** Accent when the value deserves attention. */
  tone?: "ok" | "warn" | "bad";
}

export interface MetricDef {
  id: string;
  category: MetricCategory;
  label: string;
  icon: string;
  style: MetricStyle;
  defaultEnabled: boolean;
  /** Update cadence in ms (widgets re-read the world at this rate). */
  updateMs: number;
  read(world: WorldSnapshot, format: FormatHelpers): MetricValue;
}

export interface FormatHelpers {
  num(n: number): string;
  time(totalSeconds: number): string;
  clock(date: Date): string;
}

/* ---------------- World state ---------------- */

/** A snapshot of everything the mock/live sources know. */
export interface WorldSnapshot {
  provider: string;
  model: string;
  mode: "mock" | "live";

  sessionTokens: number;
  dailyTokens: number;
  /** User-configured daily budget, mirrored into the world for metrics. */
  dailyBudget: number;
  weeklyTokens: number;
  monthlyTokens: number;
  streamingTokensPerSec: number;
  streamingProgress: number | null; // 0..1 while streaming, else null
  contextUsage: number; // 0..1
  memoryUsage: number; // 0..1 conversation memory
  promptCount: number;
  completionCount: number;
  activeToolCalls: number;
  estimatedCostUsd: number;
  aiState: "idle" | "thinking" | "responding";

  task: string;
  workspace: string;
  project: string;
  activeFile: string;
  recentFiles: string[];
  branch: string;
  commitsToday: number;
  buildStatus: "idle" | "running" | "ok" | "fail";
  buildProgress: number; // 0..1
  testStatus: "idle" | "running" | "ok" | "fail";
  lintProblems: number;
  indexProgress: number | null;

  latencyMs: number;
  latencySeries: number[];
  requestsPerMin: number;
  successRate: number; // 0..1
  retryCount: number;
  online: boolean;
  cpu: number; // 0..1
  ram: number; // 0..1

  sessionSeconds: number;
  dailySeconds: number;
  filesCreated: number;
  filesModified: number;
  linesGenerated: number;
  streakDays: number;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  dailyGoalRatio: number; // 0..1
}

/** A source of dev activity: mock simulator or a real integration adapter. */
export interface DevWorldSource {
  readonly kind: "mock" | "websocket";
  start(handlers: {
    onEvent: (event: DevEvent) => void;
    onWorld: (world: WorldSnapshot) => void;
  }): () => void;
}
