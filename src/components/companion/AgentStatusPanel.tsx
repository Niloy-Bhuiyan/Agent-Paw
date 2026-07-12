"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createAgentSource } from "@/lib/agents";
import { companionBus } from "@/lib/events/bus";
import { companionStore, useCompanionStore } from "@/lib/store/companionStore";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AgentStatus } from "@/lib/agents/types";

const STATUS_STYLE: Record<AgentStatus, { label: string; dot: string; text: string }> = {
  idle: { label: "IDLE", dot: "bg-fg-dim/40", text: "text-fg-dim" },
  thinking: { label: "THINKING", dot: "bg-pop animate-pulse", text: "text-pop" },
  working: { label: "WORKING", dot: "bg-[#28c840] animate-pulse", text: "text-[#28c840]" },
  done: { label: "DONE ✓", dot: "bg-[#28c840]", text: "text-[#28c840]" },
  error: { label: "ERROR", dot: "bg-[#e2574c]", text: "text-[#e2574c]" },
};

/**
 * Live "AI agent work status" feed. Subscribes to the configured source
 * (mock simulator, or a real WebSocket feed via NEXT_PUBLIC_AGENT_WS_URL)
 * and republishes transitions onto the companion bus for cat reactions.
 */
export function AgentStatusPanel() {
  const { t } = useLanguage();
  const agents = useCompanionStore((s) => s.agents);
  const prevStatuses = useRef<Map<string, AgentStatus>>(new Map());

  useEffect(() => {
    const source = createAgentSource();
    const stop = source.start((sessions) => {
      // Publish transitions to the bus (done/error trigger cat reactions).
      for (const session of sessions) {
        const prev = prevStatuses.current.get(session.id);
        if (prev !== session.status) {
          prevStatuses.current.set(session.id, session.status);
          if (session.status === "done") companionBus.emit("agent:done", { agent: session.agent });
          else if (session.status === "error")
            companionBus.emit("agent:error", { agent: session.agent });
          else if (session.status === "working" || session.status === "thinking")
            companionBus.emit("agent:working", { agent: session.agent });
        }
      }
      companionStore.setAgents(sessions);
    });
    return stop;
  }, []);

  const sourceIsLive = Boolean(process.env.NEXT_PUBLIC_AGENT_WS_URL);

  return (
    <div className="border-2 border-fg bg-bg-2">
      <div className="flex items-center justify-between border-b-2 border-fg px-4 py-2.5">
        <h2 className="pixel-heading text-[15px] tracking-[0.12em]">
          {t("companion.agents.title")}
        </h2>
        <span
          className={`pixel-heading border px-1.5 py-0.5 text-[10px] tracking-[0.16em] ${
            sourceIsLive ? "border-[#28c840]/60 text-[#28c840]" : "border-line text-fg-dim"
          }`}
        >
          {sourceIsLive ? "LIVE FEED" : "SIMULATED"}
        </span>
      </div>
      <ul className="divide-y divide-line">
        {agents.length === 0 && (
          <li className="px-4 py-3 text-[12px] text-fg-dim">Connecting to agents…</li>
        )}
        {agents.map((agent) => {
          const style = STATUS_STYLE[agent.status];
          return (
            <motion.li
              key={agent.id}
              layout
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${style.dot}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] text-fg">{agent.agent}</span>
                <span className="block truncate font-mono text-[11px] text-fg-dim">
                  {agent.activity}
                </span>
              </span>
              <span className={`pixel-heading text-[10px] tracking-[0.14em] ${style.text}`}>
                {style.label}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
