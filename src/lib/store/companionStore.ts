"use client";

import { useSyncExternalStore } from "react";
import type { ProviderId, ProviderInfo } from "@/lib/ai/types";
import type { AgentSession } from "@/lib/agents/types";

/**
 * Dependency-free client store built on useSyncExternalStore.
 * Holds everything the companion page renders: the conversation, the chat
 * lifecycle status, provider metadata, and live agent sessions.
 */

export type ChatStatus = "idle" | "thinking" | "streaming" | "error";

export interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Set on assistant messages while tokens are still arriving. */
  streaming?: boolean;
  /** Set when this message failed and can be retried. */
  failed?: boolean;
  provider?: ProviderId;
}

export interface CompanionState {
  messages: UiMessage[];
  status: ChatStatus;
  error: { message: string; retryable: boolean } | null;
  providers: ProviderInfo[];
  selectedProvider: ProviderId | null;
  agents: AgentSession[];
}

const initialState: CompanionState = {
  messages: [],
  status: "idle",
  error: null,
  providers: [],
  selectedProvider: null,
  agents: [],
};

let state: CompanionState = initialState;
const listeners = new Set<() => void>();

const setState = (patch: Partial<CompanionState>): void => {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const companionStore = {
  get: () => state,
  set: setState,

  addMessage(message: UiMessage) {
    setState({ messages: [...state.messages, message] });
  },

  updateMessage(id: string, patch: Partial<UiMessage>) {
    setState({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  },

  appendToMessage(id: string, text: string) {
    setState({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m,
      ),
    });
  },

  removeMessage(id: string) {
    setState({ messages: state.messages.filter((m) => m.id !== id) });
  },

  setAgents(agents: AgentSession[]) {
    setState({ agents });
  },

  reset() {
    setState({ messages: [], status: "idle", error: null });
  },
};

export function useCompanionStore<T>(selector: (s: CompanionState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState),
  );
}
