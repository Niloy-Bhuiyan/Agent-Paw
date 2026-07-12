"use client";

import { useCallback, useEffect, useRef } from "react";
import { companionBus } from "@/lib/events/bus";
import { consumeChatSse } from "@/lib/ai/sse-client";
import { companionStore, useCompanionStore } from "@/lib/store/companionStore";
import type { ChatMessage, ProviderId, ProviderInfo } from "@/lib/ai/types";

const MAX_AUTO_RETRIES = 2;
const BASE_BACKOFF_MS = 800;

const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Chat controller: sends conversation turns to /api/chat, streams the reply
 * into the store, publishes lifecycle events on the companion bus, and
 * auto-retries transient failures with exponential backoff.
 */
export function useChat() {
  const status = useCompanionStore((s) => s.status);
  const abortRef = useRef<AbortController | null>(null);

  // Load provider metadata once.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data: { providers: ProviderInfo[] }) => {
        if (cancelled || !Array.isArray(data.providers)) return;
        const def = data.providers.find((p) => p.isDefault);
        companionStore.set({
          providers: data.providers,
          selectedProvider: companionStore.get().selectedProvider ?? def?.id ?? null,
        });
      })
      .catch(() => {
        /* provider list is cosmetic; chat still works */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    companionStore.set({ status: "idle" });
  }, []);

  const runTurn = useCallback(async (history: ChatMessage[], provider: ProviderId | null) => {
    const assistantId = uid();
    companionStore.set({ status: "thinking", error: null });
    companionBus.emit("chat:thinking");

    const controller = new AbortController();
    abortRef.current = controller;

    let attempt = 0;
    // Retry loop — only re-enters for retryable failures with no partial output.
    while (true) {
      let receivedText = false;
      let failure: { message: string; retryable: boolean } | null = null;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ provider, messages: history }),
        });

        if (!response.ok || !response.body) {
          failure = {
            message: `Request failed (${response.status})`,
            retryable: response.status === 429 || response.status >= 500,
          };
        } else {
          await consumeChatSse(response.body, (event) => {
            switch (event.type) {
              case "start":
                companionStore.addMessage({
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  streaming: true,
                  provider: event.provider,
                });
                break;
              case "delta":
                if (!receivedText) {
                  receivedText = true;
                  companionStore.set({ status: "streaming" });
                  companionBus.emit("chat:streaming");
                }
                companionStore.appendToMessage(assistantId, event.text);
                break;
              case "done":
                companionStore.updateMessage(assistantId, { streaming: false });
                companionStore.set({ status: "idle" });
                companionBus.emit("chat:done");
                break;
              case "error":
                failure = { message: event.message, retryable: event.retryable };
                break;
            }
          });
        }
      } catch (error) {
        if (controller.signal.aborted) {
          companionStore.updateMessage(assistantId, { streaming: false });
          companionStore.set({ status: "idle" });
          return;
        }
        failure = { message: "Network error — is the server running?", retryable: true };
        void error;
      }

      if (!failure) return;

      // Drop the empty placeholder bubble before retrying/reporting.
      if (!receivedText) companionStore.removeMessage(assistantId);
      else companionStore.updateMessage(assistantId, { streaming: false, failed: true });

      const canAutoRetry = failure.retryable && !receivedText && attempt < MAX_AUTO_RETRIES;
      if (canAutoRetry) {
        attempt += 1;
        await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
        continue;
      }

      companionStore.set({ status: "error", error: failure });
      companionBus.emit("chat:error", { message: failure.message });
      return;
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const state = companionStore.get();
      if (!trimmed || state.status === "thinking" || state.status === "streaming") return;

      companionStore.addMessage({ id: uid(), role: "user", content: trimmed });
      const history: ChatMessage[] = [
        ...companionStore
          .get()
          .messages.filter((m) => !m.failed && m.content)
          .map((m) => ({ role: m.role, content: m.content })),
      ];
      await runTurn(history, state.selectedProvider);
    },
    [runTurn],
  );

  /** Manual retry of the last user turn after a surfaced error. */
  const retry = useCallback(async () => {
    const state = companionStore.get();
    const history = state.messages
      .filter((m) => !m.failed && m.content)
      .map((m): ChatMessage => ({ role: m.role, content: m.content }));
    if (history.at(-1)?.role !== "user") return;
    await runTurn(history, state.selectedProvider);
  }, [runTurn]);

  return { send, retry, stop, status };
}
