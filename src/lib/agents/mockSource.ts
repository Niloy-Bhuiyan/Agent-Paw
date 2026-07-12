import { pick, randRange } from "@/utils/math";
import type { AgentActivitySource, AgentSession, AgentStatus } from "@/lib/agents/types";

const AGENTS = ["Claude Code CLI", "Codex CLI", "Cursor", "Antigravity", "Kiro"] as const;

const ACTIVITIES = [
  "refactoring engine.ts",
  "running the test suite",
  "reading sprite.ts",
  "writing migration script",
  "fixing a flaky test",
  "reviewing PR #42",
  "generating docs",
  "chasing a type error",
  "optimizing bundle size",
  "grepping for TODOs",
] as const;

/** Realistic-ish lifecycle: idle → thinking → working → done (or error) → idle */
const NEXT_STATUS: Record<AgentStatus, AgentStatus[]> = {
  idle: ["thinking", "idle"],
  thinking: ["working", "working", "thinking"],
  working: ["working", "working", "done", "done", "error"],
  done: ["idle", "thinking"],
  error: ["idle", "thinking"],
};

/**
 * Simulates a plausible stream of coding-agent sessions so the whole
 * status pipeline (panel, cat reactions, events) works with zero setup.
 */
export class MockAgentSource implements AgentActivitySource {
  readonly kind = "mock" as const;

  start(onUpdate: (sessions: AgentSession[]) => void): () => void {
    const sessions: AgentSession[] = AGENTS.map((agent, i) => ({
      id: `mock-${i}`,
      agent,
      status: i === 0 ? "thinking" : "idle",
      activity: i === 0 ? pick(ACTIVITIES) : "waiting for a task",
      updatedAt: Date.now(),
    }));
    onUpdate([...sessions]);

    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (stopped) return;
      // Advance one random session per tick — feeds feel independent.
      const session = sessions[Math.floor(Math.random() * sessions.length)];
      if (session) {
        const next = pick(NEXT_STATUS[session.status]);
        if (next !== session.status) {
          session.status = next;
          session.updatedAt = Date.now();
          session.activity =
            next === "idle"
              ? "waiting for a task"
              : next === "done"
                ? "task complete ✓"
                : next === "error"
                  ? "hit an error — retrying"
                  : pick(ACTIVITIES);
          onUpdate([...sessions.map((s) => ({ ...s }))]);
        }
      }
      timer = setTimeout(tick, randRange(1800, 4200));
    };

    timer = setTimeout(tick, 1500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }
}
