import type { DevEvent, WorldSnapshot } from "@/companion-pet/types";

/* ============================================================
   Achievements — small, pluggable checks evaluated on every
   event. Each fires once per session. Add new ones by pushing
   into ACHIEVEMENTS (or calling registerAchievement).
   ============================================================ */

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  blurb: string;
  check(event: DevEvent, world: WorldSnapshot, counts: Map<string, number>): boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-green-build",
    icon: "🔨",
    title: "It compiles!",
    blurb: "First successful build of the session",
    check: (e) => e.type === "build:succeeded",
  },
  {
    id: "test-tamer",
    icon: "🧪",
    title: "Test tamer",
    blurb: "Three green test runs",
    check: (e, _w, counts) => e.type === "tests:passed" && (counts.get("tests:passed") ?? 0) >= 3,
  },
  {
    id: "commit-cadence",
    icon: "🌿",
    title: "Commit cadence",
    blurb: "Five commits today",
    check: (e, w) => e.type === "git:commit" && w.commitsToday >= 5,
  },
  {
    id: "token-thousandaire",
    icon: "🪙",
    title: "Token thousandaire",
    blurb: "10,000 session tokens streamed",
    check: (_e, w) => w.sessionTokens >= 10_000,
  },
  {
    id: "phoenix",
    icon: "🔥",
    title: "Phoenix",
    blurb: "Green build right after a failed one",
    check: (e, _w, counts) =>
      e.type === "build:succeeded" && (counts.get("build:failed") ?? 0) > 0,
  },
  {
    id: "marathon",
    icon: "⏳",
    title: "Marathon",
    blurb: "A full hour of session time",
    check: (_e, w) => w.sessionSeconds >= 3600,
  },
];

export const registerAchievement = (def: AchievementDef): void => {
  ACHIEVEMENTS.push(def);
};

/** Session-scoped tracker: counts events, unlocks each achievement once. */
export class AchievementTracker {
  private counts = new Map<string, number>();
  private unlocked = new Set<string>();

  /** Returns any achievements newly unlocked by this event. */
  onEvent(event: DevEvent, world: WorldSnapshot): AchievementDef[] {
    this.counts.set(event.type, (this.counts.get(event.type) ?? 0) + 1);
    const fresh: AchievementDef[] = [];
    for (const def of ACHIEVEMENTS) {
      if (this.unlocked.has(def.id)) continue;
      if (def.check(event, world, this.counts)) {
        this.unlocked.add(def.id);
        fresh.push(def);
      }
    }
    return fresh;
  }
}
