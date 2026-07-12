import type { DevEventType, ReactionDef, ReactionGroup } from "@/companion-pet/types";

/* ============================================================
   Reaction registry — maps dev events to emotions, dialogue,
   bubbles, particles and XP. Register new reactions with
   `registerReaction()`; the pet picks them up automatically.
   Users can disable whole groups from Settings.
   ============================================================ */

const REACTIONS = new Map<DevEventType, ReactionDef>();

export const registerReaction = (def: ReactionDef): void => {
  REACTIONS.set(def.event, def);
};

export const getReaction = (event: DevEventType): ReactionDef | undefined =>
  REACTIONS.get(event);

export const REACTION_GROUPS: ReadonlyArray<{ id: ReactionGroup; label: string }> = [
  { id: "ai", label: "AI activity" },
  { id: "build-test", label: "Builds, tests & lint" },
  { id: "git", label: "Git" },
  { id: "files", label: "Files, search & terminal" },
  { id: "system", label: "System & network" },
  { id: "wellness", label: "Wellness & presence" },
  { id: "gamification", label: "Goals & achievements" },
];

const defs: ReactionDef[] = [
  // --- AI ---
  { event: "ai:generating", group: "ai", emotion: "thinking", dialogueKey: "ai.generating", bubble: "thought", xp: 2 },
  { event: "ai:streaming", group: "ai", emotion: "focused", dialogueKey: "ai.streaming", bubble: "none", xp: 0 },
  { event: "ai:done", group: "ai", emotion: "excited", dialogueKey: "ai.done", bubble: "speech", particles: { kind: "sparkle", count: 5 }, xp: 6 },
  { event: "ai:long-thinking", group: "ai", emotion: "thinking", dialogueKey: "ai.long-thinking", bubble: "thought" },
  { event: "ai:large-response", group: "ai", emotion: "surprised", dialogueKey: "ai.large-response", bubble: "speech" },
  { event: "code:accepted", group: "ai", emotion: "happy", dialogueKey: "code.accepted", bubble: "speech", particles: { kind: "heart", count: 4 }, xp: 8 },
  { event: "code:rejected", group: "ai", emotion: "embarrassed", dialogueKey: "code.rejected", bubble: "speech" },

  // --- Build / test / lint ---
  { event: "build:started", group: "build-test", emotion: "watching", dialogueKey: "build.started", bubble: "thought", xp: 1 },
  { event: "build:succeeded", group: "build-test", emotion: "celebrating", dialogueKey: "build.succeeded", bubble: "speech", particles: { kind: "sparkle", count: 8 }, xp: 12 },
  { event: "build:failed", group: "build-test", emotion: "overheated", dialogueKey: "build.failed", bubble: "sign", particles: { kind: "steam", count: 5 } },
  { event: "lint:errors", group: "build-test", emotion: "confused", dialogueKey: "lint.errors", bubble: "note" },
  { event: "tests:running", group: "build-test", emotion: "watching", dialogueKey: "tests.running", bubble: "thought" },
  { event: "tests:passed", group: "build-test", emotion: "celebrating", dialogueKey: "tests.passed", bubble: "speech", particles: { kind: "sparkle", count: 8 }, xp: 12 },
  { event: "tests:failed", group: "build-test", emotion: "worried", dialogueKey: "tests.failed", bubble: "sign" },

  // --- Git ---
  { event: "git:commit", group: "git", emotion: "happy", dialogueKey: "git.commit", bubble: "speech", particles: { kind: "heart", count: 3 }, xp: 10 },
  { event: "git:push", group: "git", emotion: "excited", dialogueKey: "git.push", bubble: "speech", particles: { kind: "note", count: 4 }, xp: 8 },
  { event: "git:pull", group: "git", emotion: "curious", dialogueKey: "git.pull", bubble: "speech", xp: 3 },

  // --- Files / search / terminal / packages / indexing ---
  { event: "index:started", group: "files", emotion: "focused", dialogueKey: "index.started", bubble: "thought" },
  { event: "index:done", group: "files", emotion: "happy", dialogueKey: "index.done", bubble: "speech", xp: 4 },
  { event: "terminal:command", group: "files", emotion: "watching", dialogueKey: "terminal.command", bubble: "none", xp: 1 },
  { event: "pkg:installing", group: "files", emotion: "waiting", dialogueKey: "pkg.installing", bubble: "thought" },
  { event: "pkg:installed", group: "files", emotion: "happy", dialogueKey: "pkg.installed", bubble: "speech", xp: 4 },
  { event: "file:created", group: "files", emotion: "curious", dialogueKey: "file.created", bubble: "speech", xp: 2 },
  { event: "file:deleted", group: "files", emotion: "surprised", dialogueKey: "file.deleted", bubble: "speech" },
  { event: "file:renamed", group: "files", emotion: "curious", dialogueKey: "file.renamed", bubble: "speech" },
  { event: "search:running", group: "files", emotion: "playful", dialogueKey: "search.running", bubble: "thought" },
  { event: "refactor:running", group: "files", emotion: "focused", dialogueKey: "refactor.running", bubble: "thought", xp: 3 },

  // --- System / network ---
  { event: "sys:high-cpu", group: "system", emotion: "overheated", dialogueKey: "sys.high-cpu", bubble: "sign", particles: { kind: "steam", count: 4 } },
  { event: "sys:high-memory", group: "system", emotion: "worried", dialogueKey: "sys.high-memory", bubble: "note" },
  { event: "sys:low-battery", group: "system", emotion: "worried", dialogueKey: "sys.low-battery", bubble: "sign" },
  { event: "net:offline", group: "system", emotion: "sad", dialogueKey: "net.offline", bubble: "sign" },
  { event: "net:online", group: "system", emotion: "excited", dialogueKey: "net.online", bubble: "speech", particles: { kind: "sparkle", count: 5 } },

  // --- Wellness / presence ---
  { event: "user:idle", group: "wellness", emotion: "sleeping", dialogueKey: "user.idle", bubble: "thought" },
  { event: "user:active", group: "wellness", emotion: "greeting", dialogueKey: "user.active", bubble: "speech" },
  { event: "user:long-session", group: "wellness", emotion: "worried", dialogueKey: "user.long-session", bubble: "note" },
  { event: "user:break-reminder", group: "wellness", emotion: "stretching", dialogueKey: "user.break-reminder", bubble: "sign" },
  { event: "user:greeting", group: "wellness", emotion: "greeting", dialogueKey: "user.greeting", bubble: "speech", particles: { kind: "heart", count: 3 } },

  // --- Gamification ---
  { event: "goal:daily-achieved", group: "gamification", emotion: "celebrating", dialogueKey: "goal.daily-achieved", bubble: "speech", particles: { kind: "sparkle", count: 10 }, xp: 25 },
  { event: "achievement:unlocked", group: "gamification", emotion: "celebrating", dialogueKey: "achievement.unlocked", bubble: "speech", particles: { kind: "sparkle", count: 8 } },
];

defs.forEach(registerReaction);
