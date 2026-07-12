import type { AgentActivitySource, AgentSession } from "@/lib/agents/types";

/**
 * Real agent-status feed over WebSocket. Activated when
 * NEXT_PUBLIC_AGENT_WS_URL is set — the server is expected to push JSON
 * frames shaped as { sessions: AgentSession[] }. Reconnects with backoff.
 */
export class WebSocketAgentSource implements AgentActivitySource {
  readonly kind = "websocket" as const;

  constructor(private readonly url: string) {}

  start(onUpdate: (sessions: AgentSession[]) => void): () => void {
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

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as { sessions?: AgentSession[] };
          if (Array.isArray(data.sessions)) onUpdate(data.sessions);
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (stopped) return;
        timer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15_000);
      };

      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
    };
  }
}
