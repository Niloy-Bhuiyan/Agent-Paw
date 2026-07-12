"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { consumeChatSse } from "@/lib/ai/sse-client";
import { createRecognizer, MockRecognizer } from "@/companion-pet/voice/stt";
import { createSynth, speakableText } from "@/companion-pet/voice/tts";
import { MicMeter, syntheticLevels } from "@/companion-pet/voice/audio";
import { TranscriptWakeMatcher } from "@/companion-pet/voice/wakeword";
import { routeUtterance } from "@/companion-pet/tools";
import { companionMemory, learnFromUtterance, memoryContext } from "@/companion-pet/memory";
import { petSettingsStore, usePetSettings } from "@/companion-pet/settings";
import type { WorldSnapshot } from "@/companion-pet/types";
import type { ConversationTurn, MicLevels, VoicePhase } from "@/companion-pet/voice/types";
import type { EmotionId } from "@/companion-pet/types";

/* ============================================================
   useVoiceCompanion — the conversation state machine.

   idle → listening → transcribing → thinking → responding → speaking → idle
                              ↘ tool reply ↗            (interrupt at any point)

   STT/TTS run through pluggable adapters; replies stream from
   /api/chat (mock provider by default, live with env keys);
   tool intents are answered locally; memory persists turns and
   learns names/goals from what you say.
   ============================================================ */

let turnId = 0;
const nextId = () => `turn-${++turnId}-${Date.now()}`;

export interface VoiceCompanionApi {
  phase: VoicePhase;
  turns: ConversationTurn[];
  interim: string;
  levels: MicLevels;
  error: string | null;
  usingMockStt: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  interrupt: () => void;
  submitTyped: (text: string) => void;
  clearConversation: () => void;
}

interface Options {
  world: WorldSnapshot | null;
  /** Drive the pet's emotion from the conversation lifecycle. */
  onEmotion: (emotion: EmotionId, reason: string) => void;
  onSpeakingTick?: () => void;
}

export function useVoiceCompanion({ world, onEmotion, onSpeakingTick }: Options): VoiceCompanionApi {
  const voice = usePetSettings((s) => s.voice);
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [turns, setTurns] = useState<ConversationTurn[]>(
    () => companionMemory.get().history.slice(-12),
  );
  const [interim, setInterim] = useState("");
  const [levels, setLevels] = useState<MicLevels>(() => syntheticLevels(0, false));
  const [error, setError] = useState<string | null>(null);

  const recognizer = useMemo(() => createRecognizer(voice.sttProvider), [voice.sttProvider]);
  const synth = useMemo(() => createSynth(voice.ttsProvider), [voice.ttsProvider]);
  const meter = useMemo(() => new MicMeter(), []);
  const wake = useMemo(() => new TranscriptWakeMatcher(voice.wakeWord), [voice.wakeWord]);

  const phaseRef = useRef<VoicePhase>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const worldRef = useRef(world);
  worldRef.current = world;
  const micLive = useRef(false);
  const synthTick = useRef(0);

  const usingMockStt = recognizer.id === "mock";

  const go = useCallback((next: VoicePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /* ---------- synthetic waveform while mic is unavailable ---------- */
  useEffect(() => {
    const id = setInterval(() => {
      if (!micLive.current) {
        synthTick.current += 120;
        setLevels(
          syntheticLevels(
            synthTick.current,
            phaseRef.current === "listening" || phaseRef.current === "speaking",
          ),
        );
      }
    }, 120);
    return () => clearInterval(id);
  }, []);

  /* ---------- speaking ---------- */
  const speak = useCallback(
    (markdown: string) => {
      if (!voice.speakReplies) {
        go("idle");
        onEmotion("happy", "reply-shown");
        return;
      }
      go("speaking");
      onEmotion("happy", "speaking");
      synth.speak({
        text: speakableText(markdown),
        voiceId: voice.voiceId ?? undefined,
        rate: voice.rate,
        pitch: voice.pitch,
        onBoundary: onSpeakingTick,
        onEnd: () => {
          if (phaseRef.current === "speaking") {
            go("idle");
            onEmotion("idle", "spoke");
          }
        },
        onError: () => {
          go("idle");
        },
      });
    },
    [go, onEmotion, onSpeakingTick, synth, voice.pitch, voice.rate, voice.speakReplies, voice.voiceId],
  );

  /* ---------- ask the model / tools ---------- */
  const ask = useCallback(
    async (utterance: string) => {
      const text = utterance.trim();
      if (!text) {
        go("idle");
        return;
      }
      learnFromUtterance(text);
      setError(null);

      const userTurn: ConversationTurn = { id: nextId(), role: "user", content: text, at: Date.now() };
      setTurns((t) => [...t, userTurn]);
      go("thinking");
      onEmotion("thinking", "voice-question");

      // 1) Local tool routing — instant, key-free.
      const match = await routeUtterance(text, { world: worldRef.current });
      if (match) {
        const reply: ConversationTurn = {
          id: nextId(),
          role: "assistant",
          content: match.reply,
          tool: match.tool.label,
          at: Date.now(),
        };
        setTurns((t) => [...t, reply]);
        companionMemory.addTurns([userTurn, reply]);
        companionMemory.set({ totalConversations: companionMemory.get().totalConversations + 1 });
        speak(match.reply);
        return;
      }

      // 2) Provider round-trip with streaming.
      const assistantId = nextId();
      const history = [...turnsRef.current, userTurn]
        .slice(-12)
        .map((t) => ({ role: t.role, content: t.content }));

      const controller = new AbortController();
      abortRef.current = controller;
      let acc = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ messages: history, context: memoryContext() }),
        });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        await consumeChatSse(response.body, (event) => {
          if (event.type === "delta") {
            if (!acc) {
              go("responding");
              onEmotion("focused", "streaming");
              setTurns((t) => [
                ...t,
                { id: assistantId, role: "assistant", content: "", streaming: true, at: Date.now() },
              ]);
            }
            acc += event.text;
            setTurns((t) =>
              t.map((turn) => (turn.id === assistantId ? { ...turn, content: acc } : turn)),
            );
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        });

        setTurns((t) =>
          t.map((turn) => (turn.id === assistantId ? { ...turn, streaming: false } : turn)),
        );
        const reply: ConversationTurn = { id: assistantId, role: "assistant", content: acc, at: Date.now() };
        companionMemory.addTurns([userTurn, reply]);
        companionMemory.set({ totalConversations: companionMemory.get().totalConversations + 1 });
        speak(acc || "…I have nothing to say. Suspicious.");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "The conversation failed.");
        setTurns((t) => t.filter((turn) => turn.id !== assistantId || turn.content));
        go("error");
        onEmotion("worried", "voice-error");
        setTimeout(() => {
          if (phaseRef.current === "error") go("idle");
        }, 2500);
      }
    },
    [go, onEmotion, speak],
  );

  const turnsRef = useRef(turns);
  turnsRef.current = turns;

  /* ---------- listening ---------- */
  const finalBuffer = useRef("");

  const stopListening = useCallback(() => {
    recognizer.stop();
    meter.stop();
    micLive.current = false;
  }, [meter, recognizer]);

  const startListening = useCallback(() => {
    if (phaseRef.current === "listening") return;
    // Interrupt any speech in progress — speaking to the pet takes priority.
    synth.cancel();
    abortRef.current?.abort();
    setError(null);
    setInterim("");
    finalBuffer.current = "";
    go("listening");
    onEmotion("watching", "listening");

    // Mic metering (waveform + VAD) — best-effort, only for real STT.
    if (recognizer.id === "webspeech") {
      micLive.current = true;
      void meter.start({
        deviceId: voice.micDeviceId ?? undefined,
        noiseSuppression: voice.noiseSuppression,
        onLevels: setLevels,
        onError: () => {
          micLive.current = false;
        },
      });
    }

    recognizer.start({
      lang: voice.lang,
      continuous: voice.alwaysListening,
      onResult: (result) => {
        if (voice.wakeWordEnabled && voice.alwaysListening) {
          // Gate on the wake word: only text after it counts.
          const rest = wake.match(result.transcript);
          if (rest === null) return;
          setInterim(rest);
          if (result.final && rest) finalBuffer.current = rest;
          return;
        }
        setInterim(result.transcript);
        if (result.final) finalBuffer.current = result.transcript;
      },
      onEnd: () => {
        meter.stop();
        micLive.current = false;
        const text = finalBuffer.current || "";
        setInterim("");
        if (phaseRef.current !== "listening") return;
        if (text) {
          go("transcribing");
          void ask(text);
        } else {
          go("idle");
          onEmotion("confused", "heard-nothing");
        }
      },
      onError: (message) => {
        setError(message);
        meter.stop();
        micLive.current = false;
        go("idle");
      },
    });
  }, [ask, go, meter, onEmotion, recognizer, synth, voice, wake]);

  const toggleListening = useCallback(() => {
    if (phaseRef.current === "listening") stopListening();
    else startListening();
  }, [startListening, stopListening]);

  /* ---------- interruption ---------- */
  const interrupt = useCallback(() => {
    synth.cancel();
    abortRef.current?.abort();
    stopListening();
    go("idle");
    onEmotion("surprised", "interrupted");
  }, [go, onEmotion, stopListening, synth]);

  /* ---------- typed input (mock STT path) ---------- */
  const submitTyped = useCallback(
    (text: string) => {
      if (recognizer instanceof MockRecognizer && phaseRef.current === "listening") {
        recognizer.inject(text);
      } else {
        synth.cancel();
        void ask(text);
      }
    },
    [ask, recognizer, synth],
  );

  const clearConversation = useCallback(() => {
    interrupt();
    setTurns([]);
    companionMemory.clearHistory();
  }, [interrupt]);

  /* ---------- hotkey ---------- */
  useEffect(() => {
    if (!voice.enabled) return;
    const key = voice.hotkey.toLowerCase();
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || e.repeat) return;
      if (e.key.toLowerCase() !== key) return;
      e.preventDefault();
      if (voice.pttMode === "hold") startListening();
      else toggleListening();
    };
    const up = (e: KeyboardEvent) => {
      if (voice.pttMode !== "hold" || e.key.toLowerCase() !== key) return;
      recognizer.stop(); // triggers onEnd → transcript is processed
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [recognizer, startListening, toggleListening, voice.enabled, voice.hotkey, voice.pttMode]);

  /* ---------- greet on first visit of the day ---------- */
  useEffect(() => {
    const m = companionMemory.get();
    const hoursSince = (Date.now() - m.lastSeenAt) / 3.6e6;
    companionMemory.set({ greetingsCount: m.greetingsCount + 1 });
    if (hoursSince > 8) onEmotion("greeting", "returning-user");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- cleanup ---------- */
  useEffect(
    () => () => {
      recognizer.stop();
      synth.cancel();
      meter.stop();
      abortRef.current?.abort();
    },
    [meter, recognizer, synth],
  );

  /* Wave goodbye when the tab is closing. */
  useEffect(() => {
    const bye = () => petSettingsStore.get(); // touch settings to flush; memory saves on set
    window.addEventListener("beforeunload", bye);
    return () => window.removeEventListener("beforeunload", bye);
  }, []);

  return {
    phase,
    turns,
    interim,
    levels,
    error,
    usingMockStt,
    startListening,
    stopListening,
    toggleListening,
    interrupt,
    submitTyped,
    clearConversation,
  };
}
