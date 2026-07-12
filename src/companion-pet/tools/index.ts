import { companionMemory } from "@/companion-pet/memory";
import type { WorldSnapshot } from "@/companion-pet/types";

/* ============================================================
   Tool system — modular, registry-based.

   Each tool declares intent patterns; `routeUtterance()` checks
   the user's words against them before anything is sent to a
   provider. Matches run locally (instant, key-free) against the
   world snapshot / memory — these are the mock implementations.

   Real integrations (read/write files, terminal, git, browser)
   need provider tool-calling plus a host bridge; the interface
   is identical, so swapping a mock `run` for one that talks to
   a real backend changes nothing else. See docs/VOICE_COMPANION.md.
   ============================================================ */

export interface ToolContext {
  world: WorldSnapshot | null;
}

export interface ToolDef {
  id: string;
  label: string;
  description: string;
  /** Regexes tried against the utterance; first match wins. */
  intents: RegExp[];
  /** True when this is a local mock (shown in docs/settings). */
  mock: boolean;
  run(utterance: string, ctx: ToolContext): Promise<string> | string;
}

const TOOLS = new Map<string, ToolDef>();

export const registerTool = (def: ToolDef): void => {
  TOOLS.set(def.id, def);
};

export const allTools = (): ToolDef[] => [...TOOLS.values()];

const fmt = (n: number) => n.toLocaleString();

const builtins: ToolDef[] = [
  {
    id: "usage-report",
    label: "Usage report",
    description: "Token usage, budget and estimated cost",
    intents: [/token (usage|count|budget)/i, /how many tokens/i, /(spent|cost).*(today|api)/i],
    mock: true,
    run: (_u, { world }) => {
      if (!world) return "I don't have usage data yet — give me a second to look around.";
      const left = Math.max(0, world.dailyBudget - world.dailyTokens);
      return [
        `**Today's AI usage** 🪙`,
        ``,
        `| | |`,
        `| --- | --- |`,
        `| Session | ${fmt(world.sessionTokens)} tokens |`,
        `| Today | ${fmt(world.dailyTokens)} tokens |`,
        `| Budget left | ${fmt(left)} (${Math.round((left / Math.max(1, world.dailyBudget)) * 100)}%) |`,
        `| Est. cost | $${world.estimatedCostUsd.toFixed(2)} |`,
        `| Model | ${world.provider} · ${world.model} |`,
      ].join("\n");
    },
  },
  {
    id: "git-status",
    label: "Git status",
    description: "Branch and commit activity",
    intents: [/git (status|branch)/i, /which branch/i, /commits? today/i],
    mock: true,
    run: (_u, { world }) =>
      world
        ? `We're on \`${world.branch}\` with **${world.commitsToday} commits today**. The working tree looks cozy. 🌿`
        : "Git info isn't loaded yet.",
  },
  {
    id: "build-report",
    label: "Build & tests",
    description: "Current build, test and lint state",
    intents: [/build (status|state)/i, /tests? (passing|status|failing)/i, /lint/i],
    mock: true,
    run: (_u, { world }) => {
      if (!world) return "No build info yet.";
      const build =
        world.buildStatus === "ok" ? "✅ green" : world.buildStatus === "fail" ? "❌ failing" : world.buildStatus;
      const tests =
        world.testStatus === "ok" ? "✅ passing" : world.testStatus === "fail" ? "❌ failing" : world.testStatus;
      return `**Build:** ${build} · **Tests:** ${tests} · **Lint:** ${
        world.lintProblems === 0 ? "clean ✨" : `${world.lintProblems} problems`
      }`;
    },
  },
  {
    id: "session-report",
    label: "Session report",
    description: "Coding time, streak, productivity",
    intents: [/how long (have i|am i)/i, /session (time|duration)/i, /(coding )?streak/i, /productivity/i],
    mock: true,
    run: (_u, { world }) => {
      if (!world) return "Session stats are still warming up.";
      const h = Math.floor(world.sessionSeconds / 3600);
      const m = Math.floor((world.sessionSeconds % 3600) / 60);
      return `You've been coding for **${h ? `${h}h ` : ""}${m}m** this session — ${fmt(world.linesGenerated)} lines generated, ${world.filesModified} files touched, and a **${world.streakDays}-day streak**. 🔥`;
    },
  },
  {
    id: "project-info",
    label: "Project info",
    description: "Workspace, project and active file",
    intents: [/what (project|file|workspace)/i, /current (task|project|file)/i],
    mock: true,
    run: (_u, { world }) =>
      world
        ? `We're in **${world.project}** (\`${world.workspace}\`), currently poking at \`${world.activeFile}\` — the task is *${world.task}*. 📁`
        : "Project info isn't loaded yet.",
  },
  {
    id: "search-project",
    label: "Search project",
    description: "Find things in the workspace (mock index)",
    intents: [/(search|find|look) (for|up)?\s*(.+)/i],
    mock: true,
    run: (utterance, { world }) => {
      const term = /(?:search|find|look)(?: for| up)?\s+(.+)/i.exec(utterance)?.[1] ?? "that";
      const files = world?.recentFiles ?? ["engine.ts", "sprite.ts"];
      return [
        `I sniffed around for **"${term.trim()}"** and found trails in:`,
        ``,
        ...files.map((f) => `- \`${f}\``),
        ``,
        `*(mock index — wire a real search backend via the tool bridge)*`,
      ].join("\n");
    },
  },
  {
    id: "remember-goal",
    label: "Remember",
    description: "Store goals and reminders in companion memory",
    intents: [/remind me to (.+)/i, /remember (that )?(.+)/i],
    mock: false, // real: persists to companion memory
    run: (utterance) => {
      const what =
        /remind me to (.+)/i.exec(utterance)?.[1] ?? /remember (?:that )?(.+)/i.exec(utterance)?.[1];
      if (!what) return "Remember what, exactly? Say it once more.";
      const m = companionMemory.get();
      companionMemory.set({ goals: [...m.goals, what.trim()].slice(-8) });
      return `Filed away! 📌 I'll keep **"${what.trim()}"** in my whiskers.`;
    },
  },
  {
    id: "recall-goals",
    label: "Recall goals",
    description: "List remembered goals",
    intents: [/(what|list).*(goals|reminders)/i, /what did i ask you to remember/i],
    mock: false,
    run: () => {
      const goals = companionMemory.get().goals;
      return goals.length
        ? `Your notes, freshly groomed:\n\n${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}`
        : "My memory is empty — tell me *\"remind me to…\"* and I'll hold onto it.";
    },
  },
];

builtins.forEach(registerTool);

export interface ToolMatch {
  tool: ToolDef;
  reply: string;
}

/** Try to answer locally. Returns null when a provider should handle it. */
export const routeUtterance = async (
  utterance: string,
  ctx: ToolContext,
): Promise<ToolMatch | null> => {
  for (const tool of TOOLS.values()) {
    if (tool.intents.some((re) => re.test(utterance))) {
      const reply = await tool.run(utterance, ctx);
      return { tool, reply };
    }
  }
  return null;
};
