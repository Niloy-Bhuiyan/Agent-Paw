import { clamp, pick, randRange } from "@/utils/math";
import type { DevEvent, DevEventType, DevWorldSource, WorldSnapshot } from "@/companion-pet/types";

/* ============================================================
   MockDevWorld — a believable simulated development session.

   Emits DevEvents (builds, tests, git, AI streaming, wellness
   nudges…) and keeps a numeric WorldSnapshot that metrics read.
   Replace it with WebSocketWorldSource (below) by setting
   NEXT_PUBLIC_PET_WS_URL — same interface, zero code changes.
   ============================================================ */

const FILES = [
  "engine.ts",
  "sprite.ts",
  "Header.tsx",
  "useChat.ts",
  "registry.ts",
  "world.ts",
  "globals.css",
  "page.tsx",
];

const TASKS = [
  "wiring the emotion FSM",
  "polishing bubble animations",
  "refactoring the provider layer",
  "hunting a flaky test",
  "writing docs for adapters",
  "tuning particle timings",
];

const COMMANDS = ["npm run dev", "npm test", "git status", "rg TODO", "npx tsc --noEmit"];

const LEVEL_BASE = 100;

export const levelFromXp = (xp: number): { level: number; into: number; needed: number } => {
  let level = 1;
  let remaining = xp;
  let needed = LEVEL_BASE;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = Math.round(needed * 1.35);
  }
  return { level, into: remaining, needed };
};

const initialWorld = (dailyBudget: number): WorldSnapshot => ({
  provider: "Mock",
  model: "mock-cat-1",
  mode: "mock",
  sessionTokens: 0,
  dailyTokens: Math.round(randRange(4000, 9000)),
  dailyBudget,
  weeklyTokens: Math.round(randRange(40000, 80000)),
  monthlyTokens: Math.round(randRange(180000, 320000)),
  streamingTokensPerSec: 0,
  streamingProgress: null,
  contextUsage: randRange(0.15, 0.3),
  memoryUsage: randRange(0.1, 0.25),
  promptCount: 0,
  completionCount: 0,
  activeToolCalls: 0,
  estimatedCostUsd: randRange(0.4, 1.2),
  aiState: "idle",
  task: pick(TASKS),
  workspace: "~/agentpaw-clone",
  project: "agentpaw-clone",
  activeFile: pick(FILES),
  recentFiles: FILES.slice(0, 3),
  branch: "master",
  commitsToday: Math.round(randRange(1, 4)),
  buildStatus: "idle",
  buildProgress: 0,
  testStatus: "idle",
  lintProblems: 0,
  indexProgress: null,
  latencyMs: randRange(90, 200),
  latencySeries: Array.from({ length: 24 }, () => randRange(90, 260)),
  requestsPerMin: Math.round(randRange(2, 8)),
  successRate: randRange(0.96, 1),
  retryCount: 0,
  online: true,
  cpu: randRange(0.15, 0.35),
  ram: randRange(0.4, 0.6),
  sessionSeconds: 0,
  dailySeconds: Math.round(randRange(3600, 7200)),
  filesCreated: 0,
  filesModified: 0,
  linesGenerated: 0,
  streakDays: Math.round(randRange(3, 14)),
  xp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForLevel: LEVEL_BASE,
  dailyGoalRatio: randRange(0.3, 0.5),
});

interface Scenario {
  /** Relative likelihood of being picked when the world is quiet. */
  weight: number;
  run(ctx: ScenarioContext): Promise<void>;
}

interface ScenarioContext {
  world: WorldSnapshot;
  emit(type: DevEventType, detail?: string, value?: number): void;
  wait(ms: number): Promise<void>;
  stopped(): boolean;
}

/** Multi-step storylines: an AI generation, a build, a test run… */
const SCENARIOS: Scenario[] = [
  {
    // AI generation with live streaming numbers
    weight: 5,
    async run({ world, emit, wait, stopped }) {
      world.aiState = "thinking";
      world.promptCount += 1;
      emit("ai:generating", world.task);
      const thinkMs = randRange(1500, 5000);
      if (thinkMs > 4000) emit("ai:long-thinking");
      await wait(thinkMs);
      if (stopped()) return;

      world.aiState = "responding";
      emit("ai:streaming");
      const total = Math.round(randRange(300, 1800));
      let sent = 0;
      while (sent < total && !stopped()) {
        const burst = Math.round(randRange(25, 90));
        sent = Math.min(total, sent + burst);
        world.sessionTokens += burst;
        world.dailyTokens += burst;
        world.weeklyTokens += burst;
        world.monthlyTokens += burst;
        world.estimatedCostUsd += burst * 0.000012;
        world.streamingTokensPerSec = burst * (1000 / 350) * randRange(0.8, 1.2);
        world.streamingProgress = sent / total;
        world.contextUsage = clamp(world.contextUsage + burst / 200000, 0, 0.98);
        world.linesGenerated += Math.round(burst / 12);
        await wait(350);
      }
      world.streamingTokensPerSec = 0;
      world.streamingProgress = null;
      world.aiState = "idle";
      world.completionCount += 1;
      if (total > 1400) emit("ai:large-response", undefined, total);
      emit("ai:done", undefined, total);
      await wait(randRange(800, 1600));
      emit(Math.random() < 0.78 ? "code:accepted" : "code:rejected");
    },
  },
  {
    // Build cycle
    weight: 3,
    async run({ world, emit, wait, stopped }) {
      world.buildStatus = "running";
      world.buildProgress = 0;
      world.cpu = clamp(world.cpu + 0.35, 0, 0.97);
      emit("build:started");
      while (world.buildProgress < 1 && !stopped()) {
        world.buildProgress = clamp(world.buildProgress + randRange(0.08, 0.2), 0, 1);
        await wait(420);
      }
      const ok = Math.random() < 0.75;
      world.buildStatus = ok ? "ok" : "fail";
      world.cpu = clamp(world.cpu - 0.3, 0.1, 1);
      emit(ok ? "build:succeeded" : "build:failed");
      if (!ok) {
        world.lintProblems = Math.round(randRange(1, 6));
        await wait(1200);
        emit("lint:errors", undefined, world.lintProblems);
      } else {
        world.lintProblems = 0;
      }
    },
  },
  {
    // Test run
    weight: 3,
    async run({ world, emit, wait, stopped }) {
      world.testStatus = "running";
      emit("tests:running");
      await wait(randRange(2500, 5000));
      if (stopped()) return;
      const ok = Math.random() < 0.72;
      world.testStatus = ok ? "ok" : "fail";
      emit(ok ? "tests:passed" : "tests:failed");
    },
  },
  {
    // Git flow
    weight: 2,
    async run({ world, emit, wait }) {
      const action = pick(["commit", "push", "pull"] as const);
      if (action === "commit") {
        world.commitsToday += 1;
        emit("git:commit", `feat: ${world.task}`);
      } else if (action === "push") emit("git:push", world.branch);
      else emit("git:pull", world.branch);
      await wait(400);
    },
  },
  {
    // File & terminal noise
    weight: 3,
    async run({ world, emit, wait }) {
      const roll = Math.random();
      if (roll < 0.3) {
        world.filesCreated += 1;
        world.activeFile = pick(FILES);
        emit("file:created", world.activeFile);
      } else if (roll < 0.4) emit("file:deleted", pick(FILES));
      else if (roll < 0.5) emit("file:renamed", pick(FILES));
      else if (roll < 0.75) {
        world.filesModified += 1;
        emit("terminal:command", pick(COMMANDS));
      } else if (roll < 0.9) emit("search:running", "TODO|FIXME");
      else emit("refactor:running", world.activeFile);
      await wait(300);
    },
  },
  {
    // Package install / indexing
    weight: 1,
    async run({ world, emit, wait, stopped }) {
      if (Math.random() < 0.5) {
        emit("pkg:installing", "left-paw@2.0.0");
        await wait(randRange(2500, 4500));
        if (!stopped()) emit("pkg:installed", "left-paw@2.0.0");
      } else {
        world.indexProgress = 0;
        emit("index:started");
        while ((world.indexProgress ?? 1) < 1 && !stopped()) {
          world.indexProgress = clamp((world.indexProgress ?? 0) + randRange(0.1, 0.25), 0, 1);
          await wait(500);
        }
        world.indexProgress = null;
        emit("index:done");
      }
    },
  },
  {
    // System / network hiccups (rare)
    weight: 1,
    async run({ world, emit, wait, stopped }) {
      const roll = Math.random();
      if (roll < 0.35) {
        world.cpu = clamp(randRange(0.85, 0.97), 0, 1);
        emit("sys:high-cpu", undefined, world.cpu);
        await wait(3000);
        world.cpu = randRange(0.25, 0.45);
      } else if (roll < 0.6) {
        world.ram = clamp(randRange(0.86, 0.95), 0, 1);
        emit("sys:high-memory", undefined, world.ram);
        await wait(2500);
        world.ram = randRange(0.5, 0.65);
      } else if (roll < 0.8) {
        emit("sys:low-battery", undefined, 0.15);
      } else {
        world.online = false;
        emit("net:offline");
        await wait(randRange(3000, 6000));
        if (stopped()) return;
        world.online = true;
        emit("net:online");
      }
    },
  },
];

const totalWeight = SCENARIOS.reduce((sum, s) => sum + s.weight, 0);
const pickScenario = (): Scenario => {
  let roll = Math.random() * totalWeight;
  for (const s of SCENARIOS) {
    roll -= s.weight;
    if (roll <= 0) return s;
  }
  return SCENARIOS[0] as Scenario;
};

export interface MockWorldOptions {
  dailyBudget: number;
  /** Multiplier on scenario pacing; 1 = normal, 2 = twice as busy. */
  tempo?: number;
  breakReminderMinutes?: number;
}

export class MockDevWorld implements DevWorldSource {
  readonly kind = "mock" as const;

  constructor(private readonly opts: MockWorldOptions) {}

  start(handlers: {
    onEvent: (event: DevEvent) => void;
    onWorld: (world: WorldSnapshot) => void;
  }): () => void {
    const world = initialWorld(this.opts.dailyBudget);
    let stopped = false;
    let budgetWarned = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const emit = (type: DevEventType, detail?: string, value?: number) => {
      if (stopped) return;
      handlers.onEvent({ type, detail, value, at: Date.now() });
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          timers.delete(t);
          resolve();
        }, ms);
        timers.add(t);
      });

    const ctx: ScenarioContext = { world, emit, wait, stopped: () => stopped };

    // Greeting on arrival.
    const greet = setTimeout(() => emit("user:greeting"), 900);
    timers.add(greet);

    // 1 Hz heartbeat: clocks, latency drift, goal progress, publish snapshot.
    const heartbeat = setInterval(() => {
      if (stopped || document.hidden) return;
      world.sessionSeconds += 1;
      world.dailySeconds += 1;
      world.latencyMs = clamp(world.latencyMs + randRange(-30, 30), 60, 1200);
      world.latencySeries = [...world.latencySeries.slice(-23), world.latencyMs];
      world.requestsPerMin = Math.max(0, Math.round(world.requestsPerMin + randRange(-1, 1)));
      world.cpu = clamp(world.cpu + randRange(-0.03, 0.03), 0.08, 0.97);
      world.ram = clamp(world.ram + randRange(-0.01, 0.015), 0.3, 0.95);
      world.dailyGoalRatio = clamp(world.dailyGoalRatio + 0.0004, 0, 1.2);

      if (world.dailyGoalRatio >= 1 && world.dailyGoalRatio < 1.001) emit("goal:daily-achieved");
      const budgetLeft = 1 - world.dailyTokens / Math.max(1, world.dailyBudget);
      if (budgetLeft < 0.2 && !budgetWarned) {
        budgetWarned = true;
        emit("sys:high-memory"); // nudge via worried face…
      }
      if (world.sessionSeconds > 0 && world.sessionSeconds % (60 * 45) === 0)
        emit("user:long-session", undefined, world.sessionSeconds);

      handlers.onWorld({ ...world, latencySeries: [...world.latencySeries] });
    }, 1000);

    // Break reminder cadence.
    const breakEvery = (this.opts.breakReminderMinutes ?? 20) * 60_000;
    const breaks = setInterval(() => {
      if (!stopped && !document.hidden) emit("user:break-reminder");
    }, breakEvery);

    // Scenario loop.
    const tempo = this.opts.tempo ?? 1;
    const loop = async () => {
      await wait(randRange(2500, 5000) / tempo);
      while (!stopped) {
        if (!document.hidden) await pickScenario().run(ctx);
        await wait(randRange(3000, 8000) / tempo);
      }
    };
    void loop();

    return () => {
      stopped = true;
      clearInterval(heartbeat);
      clearInterval(breaks);
      for (const t of timers) clearTimeout(t);
    };
  }
}

/* ============================================================
   WebSocketWorldSource — the "live mode" adapter.
   Point NEXT_PUBLIC_PET_WS_URL at a feed pushing frames:
     { "event": DevEvent }  and/or  { "world": Partial<WorldSnapshot> }
   See docs/COMPANION_PET.md for wiring real tools (Claude Code
   hooks, VS Code extensions, git watchers) into this shape.
   ============================================================ */

export class WebSocketWorldSource implements DevWorldSource {
  readonly kind = "websocket" as const;

  constructor(
    private readonly url: string,
    private readonly dailyBudget: number,
  ) {}

  start(handlers: {
    onEvent: (event: DevEvent) => void;
    onWorld: (world: WorldSnapshot) => void;
  }): () => void {
    const world = initialWorld(this.dailyBudget);
    world.mode = "live";
    let socket: WebSocket | null = null;
    let stopped = false;
    let retryDelay = 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(this.url);
      socket.onopen = () => {
        retryDelay = 1000;
      };
      socket.onmessage = (msg) => {
        try {
          const frame = JSON.parse(String(msg.data)) as {
            event?: DevEvent;
            world?: Partial<WorldSnapshot>;
          };
          if (frame.event) handlers.onEvent(frame.event);
          if (frame.world) handlers.onWorld(Object.assign(world, frame.world, { mode: "live" }));
        } catch {
          // ignore malformed frames
        }
      };
      socket.onclose = () => {
        if (stopped) return;
        timer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    handlers.onWorld({ ...world });
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
    };
  }
}

export const createWorldSource = (dailyBudget: number, tempo: number): DevWorldSource => {
  const url = process.env.NEXT_PUBLIC_PET_WS_URL;
  return url
    ? new WebSocketWorldSource(url, dailyBudget)
    : new MockDevWorld({ dailyBudget, tempo });
};
