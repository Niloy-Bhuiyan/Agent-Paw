import { MockAgentSource } from "@/lib/agents/mockSource";
import { WebSocketAgentSource } from "@/lib/agents/wsSource";
import type { AgentActivitySource } from "@/lib/agents/types";

/**
 * Pick the agent-status source from the environment: a real WebSocket feed
 * when NEXT_PUBLIC_AGENT_WS_URL is set, the built-in simulator otherwise.
 */
export const createAgentSource = (): AgentActivitySource => {
  const url = process.env.NEXT_PUBLIC_AGENT_WS_URL;
  return url ? new WebSocketAgentSource(url) : new MockAgentSource();
};

export type { AgentActivitySource, AgentSession, AgentStatus } from "@/lib/agents/types";
