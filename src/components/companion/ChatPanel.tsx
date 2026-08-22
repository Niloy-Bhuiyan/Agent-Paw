"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useCompanionStore } from "@/lib/store/companionStore";
import { useLanguage } from "@/contexts/LanguageContext";

/** The conversation column: message list, typing indicator, error banner, input. */
export function ChatPanel() {
  const { t } = useLanguage();
  const { send, retry, stop, status } = useChat();
  const messages = useCompanionStore((s) => s.messages);
  const error = useCompanionStore((s) => s.error);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const busy = status === "thinking" || status === "streaming";

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy || !draft.trim()) return;
    void send(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-2 border-fg bg-bg-2">
      <div className="flex items-center justify-between border-b-2 border-fg px-4 py-2.5">
        <h2 className="pixel-heading text-[17px] tracking-[0.12em]">
          {t("companion.chat.title")}
        </h2>
        <StatusIndicator />
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-[13px] text-fg-dim">{t("companion.chat.empty")}</p>
        )}
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] border-2 px-3 py-2 text-[13px] leading-relaxed ${
                message.role === "user"
                  ? "border-fg bg-fg text-bg"
                  : message.failed
                    ? "border-[#e2574c]/70 text-fg-dim"
                    : "border-line bg-bg text-fg"
              }`}
            >
              {message.content || (message.streaming ? "…" : "")}
              {message.streaming && message.content && (
                <span className="animate-blink-hint ml-0.5" aria-hidden="true">
                  ▌
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {status === "thinking" && (
          <div className="flex justify-start">
            <div className="border-2 border-line bg-bg px-3 py-2">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="border-t-2 border-[#e2574c] bg-[#e2574c]/10 px-4 py-2.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-fg">
                <span aria-hidden="true">🔥 </span>
                {error.message}
              </span>
              {error.retryable && (
                <button
                  type="button"
                  onClick={() => void retry()}
                  className="focus-pixel pixel-heading cursor-pointer border border-fg px-2.5 py-1 text-[12px] tracking-[0.12em] text-fg transition-colors hover:bg-fg hover:text-bg"
                >
                  {t("companion.chat.retry")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={submit} className="flex gap-2 border-t-2 border-fg p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("companion.chat.placeholder")}
          aria-label="Message"
          maxLength={4000}
          className="focus-pixel min-w-0 flex-1 border-2 border-line bg-bg px-3 py-2.5 font-mono text-[13px] text-fg placeholder:text-fg-dim/50"
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            className="focus-pixel pixel-heading cursor-pointer border-2 border-line px-4 text-[15px] tracking-[0.1em] text-fg-dim transition-colors hover:border-fg hover:text-fg"
          >
            {t("companion.chat.stop")}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="focus-pixel pixel-heading cursor-pointer border-2 border-fg bg-fg px-4 text-[15px] tracking-[0.1em] text-bg transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("companion.chat.send")}
          </button>
        )}
      </form>
    </div>
  );
}

function StatusIndicator() {
  const status = useCompanionStore((s) => s.status);
  const config = {
    idle: { label: "IDLE", cls: "text-fg-dim border-line" },
    thinking: { label: "THINKING", cls: "text-pop border-pop/60" },
    streaming: { label: "STREAMING", cls: "text-[#28c840] border-[#28c840]/60" },
    error: { label: "ERROR", cls: "text-[#e2574c] border-[#e2574c]/60" },
  }[status];

  return (
    <span
      role="status"
      className={`pixel-heading border px-2 py-0.5 text-[10px] tracking-[0.2em] ${config.cls} ${
        status === "thinking" || status === "streaming" ? "animate-blink-hint" : ""
      }`}
    >
      {config.label}
    </span>
  );
}

function TypingDots() {
  return (
    <span className="pixel-heading inline-flex gap-1 text-[16px] text-fg-dim" aria-label="AgentPaw is thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22 }}
        >
          ●
        </motion.span>
      ))}
    </span>
  );
}
