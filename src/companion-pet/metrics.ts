import type { MetricCategory, MetricDef } from "@/companion-pet/types";

/* ============================================================
   Metric registry. Each metric is an independent plugin:
   id + category + display style + a pure `read(world)` function.
   Users toggle each one in Settings; widgets render them around
   the pet. Register new metrics with `registerMetric()`.
   ============================================================ */

const METRICS = new Map<string, MetricDef>();

export const registerMetric = (def: MetricDef): void => {
  METRICS.set(def.id, def);
};

export const allMetrics = (): MetricDef[] => [...METRICS.values()];

export const METRIC_CATEGORIES: ReadonlyArray<{ id: MetricCategory; label: string }> = [
  { id: "ai", label: "AI usage" },
  { id: "dev", label: "Development activity" },
  { id: "perf", label: "Performance" },
  { id: "productivity", label: "Productivity" },
];

const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;

const defs: MetricDef[] = [
  /* ---------------- AI usage ---------------- */
  {
    id: "ai.state",
    category: "ai",
    label: "AI status",
    icon: "🤖",
    style: "badge",
    defaultEnabled: true,
    updateMs: 500,
    read: (w) => ({
      text: w.aiState === "idle" ? "idle" : w.aiState === "thinking" ? "thinking…" : "responding",
      tone: w.aiState === "idle" ? "ok" : undefined,
    }),
  },
  {
    id: "ai.model",
    category: "ai",
    label: "Provider · model",
    icon: "🧠",
    style: "badge",
    defaultEnabled: true,
    updateMs: 5000,
    read: (w) => ({ text: `${w.provider} · ${w.model}` }),
  },
  {
    id: "ai.sessionTokens",
    category: "ai",
    label: "Session tokens",
    icon: "🪙",
    style: "badge",
    defaultEnabled: true,
    updateMs: 500,
    read: (w, f) => ({ text: `${f.num(w.sessionTokens)} tok` }),
  },
  {
    id: "ai.tokenSpeed",
    category: "ai",
    label: "Streaming speed",
    icon: "⚡",
    style: "badge",
    defaultEnabled: true,
    updateMs: 400,
    read: (w, f) =>
      w.streamingTokensPerSec > 0
        ? { text: `${f.num(Math.round(w.streamingTokensPerSec))} tok/s`, tone: "ok" }
        : { text: "— tok/s" },
  },
  {
    id: "ai.streamingProgress",
    category: "ai",
    label: "Streaming progress",
    icon: "📡",
    style: "bar",
    defaultEnabled: true,
    updateMs: 300,
    read: (w) =>
      w.streamingProgress === null
        ? { text: "not streaming", ratio: 0 }
        : { text: pct(w.streamingProgress), ratio: w.streamingProgress, tone: "ok" },
  },
  {
    id: "ai.dailyBudget",
    category: "ai",
    label: "Daily token budget",
    icon: "🏦",
    style: "bar",
    defaultEnabled: true,
    updateMs: 1000,
    read: (w, f) => {
      const budget = w.dailyBudget > 0 ? w.dailyBudget : 1;
      const used = Math.min(1, w.dailyTokens / budget);
      return {
        text: `${f.num(w.dailyTokens)} / ${f.num(w.dailyBudget)}`,
        ratio: used,
        tone: used > 0.9 ? "bad" : used > 0.7 ? "warn" : "ok",
      };
    },
  },
  {
    id: "ai.weeklyTokens",
    category: "ai",
    label: "Weekly tokens",
    icon: "🗓",
    style: "badge",
    defaultEnabled: false,
    updateMs: 5000,
    read: (w, f) => ({ text: `${f.num(w.weeklyTokens)} wk` }),
  },
  {
    id: "ai.monthlyTokens",
    category: "ai",
    label: "Monthly tokens",
    icon: "📅",
    style: "badge",
    defaultEnabled: false,
    updateMs: 5000,
    read: (w, f) => ({ text: `${f.num(w.monthlyTokens)} mo` }),
  },
  {
    id: "ai.cost",
    category: "ai",
    label: "Estimated cost",
    icon: "💸",
    style: "badge",
    defaultEnabled: true,
    updateMs: 2000,
    read: (w) => ({ text: `$${w.estimatedCostUsd.toFixed(2)} today` }),
  },
  {
    id: "ai.context",
    category: "ai",
    label: "Context window",
    icon: "🧵",
    style: "bar",
    defaultEnabled: true,
    updateMs: 1000,
    read: (w) => ({
      text: pct(w.contextUsage),
      ratio: w.contextUsage,
      tone: w.contextUsage > 0.85 ? "bad" : w.contextUsage > 0.6 ? "warn" : "ok",
    }),
  },
  {
    id: "ai.memory",
    category: "ai",
    label: "Conversation memory",
    icon: "💭",
    style: "bar",
    defaultEnabled: false,
    updateMs: 2000,
    read: (w) => ({ text: pct(w.memoryUsage), ratio: w.memoryUsage }),
  },
  {
    id: "ai.counts",
    category: "ai",
    label: "Prompts / completions",
    icon: "💬",
    style: "badge",
    defaultEnabled: false,
    updateMs: 2000,
    read: (w) => ({ text: `${w.promptCount} ⇄ ${w.completionCount}` }),
  },
  {
    id: "ai.tools",
    category: "ai",
    label: "Active tool calls",
    icon: "🔧",
    style: "badge",
    defaultEnabled: false,
    updateMs: 800,
    read: (w) => ({
      text: w.activeToolCalls > 0 ? `${w.activeToolCalls} running` : "none",
      tone: w.activeToolCalls > 0 ? "warn" : undefined,
    }),
  },

  /* ---------------- Development activity ---------------- */
  {
    id: "dev.task",
    category: "dev",
    label: "Current task",
    icon: "📌",
    style: "note",
    defaultEnabled: true,
    updateMs: 3000,
    read: (w) => ({ text: w.task }),
  },
  {
    id: "dev.project",
    category: "dev",
    label: "Project · file",
    icon: "📁",
    style: "badge",
    defaultEnabled: true,
    updateMs: 3000,
    read: (w) => ({ text: `${w.project} › ${w.activeFile}` }),
  },
  {
    id: "dev.build",
    category: "dev",
    label: "Build",
    icon: "🔨",
    style: "bar",
    defaultEnabled: true,
    updateMs: 400,
    read: (w) => {
      if (w.buildStatus === "running")
        return { text: `building ${pct(w.buildProgress)}`, ratio: w.buildProgress, tone: "warn" };
      if (w.buildStatus === "ok") return { text: "build ✓", ratio: 1, tone: "ok" };
      if (w.buildStatus === "fail") return { text: "build ✗", ratio: 1, tone: "bad" };
      return { text: "no build", ratio: 0 };
    },
  },
  {
    id: "dev.tests",
    category: "dev",
    label: "Tests",
    icon: "🧪",
    style: "badge",
    defaultEnabled: true,
    updateMs: 800,
    read: (w) => {
      if (w.testStatus === "running") return { text: "running…", tone: "warn" };
      if (w.testStatus === "ok") return { text: "passing", tone: "ok" };
      if (w.testStatus === "fail") return { text: "failing", tone: "bad" };
      return { text: "idle" };
    },
  },
  {
    id: "dev.lint",
    category: "dev",
    label: "Lint",
    icon: "🧹",
    style: "badge",
    defaultEnabled: false,
    updateMs: 2000,
    read: (w) =>
      w.lintProblems === 0
        ? { text: "clean", tone: "ok" }
        : { text: `${w.lintProblems} problems`, tone: w.lintProblems > 5 ? "bad" : "warn" },
  },
  {
    id: "dev.branch",
    category: "dev",
    label: "Git branch",
    icon: "🌿",
    style: "badge",
    defaultEnabled: true,
    updateMs: 3000,
    read: (w) => ({ text: `${w.branch} · ${w.commitsToday} commits today` }),
  },
  {
    id: "dev.indexing",
    category: "dev",
    label: "Indexing",
    icon: "🗃",
    style: "bar",
    defaultEnabled: false,
    updateMs: 500,
    read: (w) =>
      w.indexProgress === null
        ? { text: "indexed", ratio: 1, tone: "ok" }
        : { text: `indexing ${pct(w.indexProgress)}`, ratio: w.indexProgress, tone: "warn" },
  },

  /* ---------------- Performance ---------------- */
  {
    id: "perf.latency",
    category: "perf",
    label: "Latency",
    icon: "⏱",
    style: "chart",
    defaultEnabled: true,
    updateMs: 1000,
    read: (w) => ({
      text: `${Math.round(w.latencyMs)} ms`,
      series: w.latencySeries,
      tone: w.latencyMs > 800 ? "bad" : w.latencyMs > 350 ? "warn" : "ok",
    }),
  },
  {
    id: "perf.rpm",
    category: "perf",
    label: "Requests / min",
    icon: "📈",
    style: "badge",
    defaultEnabled: false,
    updateMs: 2000,
    read: (w) => ({ text: `${w.requestsPerMin} rpm` }),
  },
  {
    id: "perf.success",
    category: "perf",
    label: "Success rate",
    icon: "🎯",
    style: "badge",
    defaultEnabled: true,
    updateMs: 3000,
    read: (w) => ({
      text: pct(w.successRate),
      tone: w.successRate > 0.97 ? "ok" : w.successRate > 0.9 ? "warn" : "bad",
    }),
  },
  {
    id: "perf.retries",
    category: "perf",
    label: "Retries",
    icon: "🔁",
    style: "badge",
    defaultEnabled: false,
    updateMs: 3000,
    read: (w) => ({ text: `${w.retryCount} today`, tone: w.retryCount > 5 ? "warn" : undefined }),
  },
  {
    id: "perf.network",
    category: "perf",
    label: "Network",
    icon: "🌐",
    style: "badge",
    defaultEnabled: true,
    updateMs: 1000,
    read: (w) =>
      w.online ? { text: "online", tone: "ok" } : { text: "offline", tone: "bad" },
  },
  {
    id: "perf.cpu",
    category: "perf",
    label: "CPU",
    icon: "🖥",
    style: "bar",
    defaultEnabled: true,
    updateMs: 1000,
    read: (w) => ({
      text: pct(w.cpu),
      ratio: w.cpu,
      tone: w.cpu > 0.85 ? "bad" : w.cpu > 0.6 ? "warn" : "ok",
    }),
  },
  {
    id: "perf.ram",
    category: "perf",
    label: "RAM",
    icon: "🧮",
    style: "bar",
    defaultEnabled: false,
    updateMs: 2000,
    read: (w) => ({ text: pct(w.ram), ratio: w.ram, tone: w.ram > 0.85 ? "warn" : undefined }),
  },

  /* ---------------- Productivity ---------------- */
  {
    id: "prod.session",
    category: "productivity",
    label: "Session time",
    icon: "⏳",
    style: "badge",
    defaultEnabled: true,
    updateMs: 1000,
    read: (w, f) => ({ text: f.time(w.sessionSeconds) }),
  },
  {
    id: "prod.daily",
    category: "productivity",
    label: "Coding today",
    icon: "📆",
    style: "badge",
    defaultEnabled: false,
    updateMs: 5000,
    read: (w, f) => ({ text: f.time(w.dailySeconds) }),
  },
  {
    id: "prod.files",
    category: "productivity",
    label: "Files touched",
    icon: "📝",
    style: "badge",
    defaultEnabled: false,
    updateMs: 3000,
    read: (w) => ({ text: `+${w.filesCreated} new · ${w.filesModified} edited` }),
  },
  {
    id: "prod.lines",
    category: "productivity",
    label: "Lines generated",
    icon: "🧾",
    style: "badge",
    defaultEnabled: true,
    updateMs: 2000,
    read: (w, f) => ({ text: `${f.num(w.linesGenerated)} loc` }),
  },
  {
    id: "prod.streak",
    category: "productivity",
    label: "Coding streak",
    icon: "🔥",
    style: "badge",
    defaultEnabled: true,
    updateMs: 10000,
    read: (w) => ({ text: `${w.streakDays}-day streak`, tone: "ok" }),
  },
  {
    id: "prod.goal",
    category: "productivity",
    label: "Daily goal",
    icon: "🏁",
    style: "bar",
    defaultEnabled: true,
    updateMs: 2000,
    read: (w) => ({
      text: pct(w.dailyGoalRatio),
      ratio: w.dailyGoalRatio,
      tone: w.dailyGoalRatio >= 1 ? "ok" : undefined,
    }),
  },
];

defs.forEach(registerMetric);
