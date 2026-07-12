/** Agent work-status feed — the "AI agent reactions" feature of the app. */

export type AgentStatus = "idle" | "thinking" | "working" | "done" | "error";

export interface AgentSession {
  id: string;
  /** e.g. "Claude Code CLI", "Codex CLI", "Cursor" */
  agent: string;
  status: AgentStatus;
  /** Short human-readable activity line, e.g. "refactoring engine.ts". */
  activity: string;
  updatedAt: number;
}

/**
 * A source of agent status events. The mock source simulates sessions;
 * the WebSocket source connects to a real feed when
 * NEXT_PUBLIC_AGENT_WS_URL is configured — same interface, no code change.
 */
export interface AgentActivitySource {
  /** Begin emitting. Returns a stop function. */
  start(onUpdate: (sessions: AgentSession[]) => void): () => void;
  readonly kind: "mock" | "websocket";
}
