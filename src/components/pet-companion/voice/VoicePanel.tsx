"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Markdown } from "@/components/pet-companion/voice/Markdown";
import { Waveform } from "@/components/pet-companion/voice/Waveform";
import { useCompanionMemory } from "@/companion-pet/memory";
import { usePetSettings } from "@/companion-pet/settings";
import type { VoiceCompanionApi } from "@/companion-pet/voice/useVoiceCompanion";

/* ============================================================
   VoicePanel — the pet's voice: talk button, waveform, phase
   indicators, and a floating conversation window with markdown,
   code blocks and copy actions. Not a chat app: it floats above
   the stage and can be dismissed while the pet keeps listening.
   ============================================================ */

const PHASE_LABEL: Record<string, { text: string; cls: string; pulse?: boolean }> = {
  idle: { text: "TAP TO TALK", cls: "text-fg-dim border-line" },
  listening: { text: "LISTENING", cls: "text-[#28c840] border-[#28c840]/60", pulse: true },
  transcribing: { text: "GOT IT", cls: "text-pop border-pop/60" },
  thinking: { text: "THINKING", cls: "text-pop border-pop/60", pulse: true },
  responding: { text: "RESPONDING", cls: "text-[#9ecbff] border-[#9ecbff]/60", pulse: true },
  speaking: { text: "SPEAKING", cls: "text-pop border-pop/60", pulse: true },
  error: { text: "HICCUP", cls: "text-[#e2574c] border-[#e2574c]/60" },
};

export function VoicePanel({ api }: { api: VoiceCompanionApi }) {
  const voice = usePetSettings((s) => s.voice);
  const companionName = useCompanionMemory((m) => m.companionName);
  const [windowOpen, setWindowOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const label = PHASE_LABEL[api.phase] ?? PHASE_LABEL.idle!;

  // Open the window when a conversation starts; keep newest turn in view.
  useEffect(() => {
    if (api.turns.length > 0) setWindowOpen(true);
  }, [api.turns.length]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [api.turns, api.interim]);

  if (!voice.enabled) return null;

  const busy = api.phase === "thinking" || api.phase === "responding";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    api.submitTyped(draft.trim());
    setDraft("");
  };

  return (
    <>
      {/* ---------- control cluster under the cat ---------- */}
      <div className="pointer-events-auto mt-3 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={api.toggleListening}
            aria-label={api.phase === "listening" ? "Stop listening" : "Start voice conversation"}
            className={`focus-pixel relative flex size-12 cursor-pointer items-center justify-center border-2 text-[18px] transition-all ${
              api.phase === "listening"
                ? "border-[#28c840] bg-[#28c840]/15 text-[#28c840]"
                : "border-fg bg-bg text-fg hover:-translate-y-[1px] hover:border-pop hover:text-pop"
            }`}
          >
            {api.phase === "listening" && (
              <motion.span
                className="absolute inset-0 border-2 border-[#28c840]"
                animate={{ opacity: [0.6, 0], scale: [1, 1.35] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                aria-hidden="true"
              />
            )}
            🎤
          </button>

          <div className="w-32">
            <Waveform levels={api.levels} phase={api.phase} />
          </div>

          {(api.phase === "speaking" || busy) && (
            <button
              type="button"
              onClick={api.interrupt}
              className="focus-pixel pixel-heading cursor-pointer border border-line px-2.5 py-1.5 text-[11px] tracking-[0.12em] text-fg-dim transition-colors hover:border-[#e2574c] hover:text-[#e2574c]"
            >
              ■ STOP
            </button>
          )}
        </div>

        <span
          role="status"
          className={`pixel-heading border px-2 py-0.5 text-[9px] tracking-[0.22em] ${label.cls} ${
            label.pulse ? "animate-blink-hint" : ""
          }`}
        >
          {label.text}
          <span className="ml-1.5 text-fg-dim/60">[{voice.hotkey.toUpperCase()}]</span>
        </span>

        {/* Live transcript while listening */}
        <AnimatePresence>
          {api.interim && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-[320px] text-center font-mono text-[12px] italic text-fg-dim"
            >
              &ldquo;{api.interim}&rdquo;
            </motion.p>
          )}
        </AnimatePresence>

        {api.error && (
          <p role="alert" className="max-w-[320px] text-center text-[11px] text-[#e2574c]">
            {api.error}
          </p>
        )}

        {/* Mock-STT input: type what you'd say */}
        {api.usingMockStt && (
          <form onSubmit={submit} className="flex w-[300px] gap-1.5">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Type to talk to ${companionName}… (mock mic)`}
              aria-label="Type your message"
              className="focus-pixel min-w-0 flex-1 border border-line bg-bg px-2.5 py-1.5 font-mono text-[11.5px] text-fg placeholder:text-fg-dim/50"
            />
            <button
              type="submit"
              disabled={!draft.trim() || busy}
              className="focus-pixel pixel-heading cursor-pointer border border-fg bg-fg px-2.5 text-[11px] text-bg disabled:opacity-40"
            >
              ▸
            </button>
          </form>
        )}
      </div>

      {/* ---------- floating conversation window ---------- */}
      <AnimatePresence>
        {windowOpen && api.turns.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            aria-label="Conversation with the companion"
            className="pointer-events-auto absolute bottom-4 left-4 z-30 flex max-h-[55%] w-[min(380px,calc(100%-2rem))] flex-col border-2 border-fg bg-bg/95 shadow-[6px_6px_0_0_rgba(255,210,63,0.25)] backdrop-blur-sm"
          >
            <header className="flex items-center justify-between border-b-2 border-fg px-3 py-2">
              <h3 className="pixel-heading text-[12px] tracking-[0.16em]">
                💬 {companionName.toUpperCase()}
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={api.clearConversation}
                  aria-label="Clear conversation"
                  className="focus-pixel cursor-pointer px-1.5 text-[11px] text-fg-dim hover:text-fg"
                >
                  ⌫
                </button>
                <button
                  type="button"
                  onClick={() => setWindowOpen(false)}
                  aria-label="Minimize conversation"
                  className="focus-pixel cursor-pointer px-1.5 text-[11px] text-fg-dim hover:text-fg"
                >
                  —
                </button>
              </div>
            </header>

            <div ref={logRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
              {api.turns.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] border px-2.5 py-1.5 ${
                      turn.role === "user"
                        ? "border-fg bg-fg text-bg"
                        : "border-line bg-bg-2 text-fg"
                    }`}
                  >
                    {turn.tool && (
                      <span className="pixel-heading mb-1 block text-[8.5px] tracking-[0.18em] text-pop">
                        🔧 {turn.tool.toUpperCase()}
                      </span>
                    )}
                    {turn.role === "user" ? (
                      <p className="text-[12.5px] leading-relaxed">{turn.content}</p>
                    ) : (
                      <Markdown>{turn.content}</Markdown>
                    )}
                    {turn.streaming && (
                      <span className="animate-blink-hint text-pop" aria-hidden="true">
                        ▌
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {api.phase === "thinking" && (
                <div className="flex items-center gap-1.5 text-fg-dim" aria-label="Thinking">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 bg-fg-dim"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Reopen chip when minimized */}
      {!windowOpen && api.turns.length > 0 && (
        <button
          type="button"
          onClick={() => setWindowOpen(true)}
          className="focus-pixel pixel-heading pointer-events-auto absolute bottom-4 left-4 z-30 cursor-pointer border-2 border-line bg-bg px-3 py-1.5 text-[11px] tracking-[0.14em] text-fg-dim transition-colors hover:border-fg hover:text-fg"
        >
          💬 {api.turns.length}
        </button>
      )}
    </>
  );
}
