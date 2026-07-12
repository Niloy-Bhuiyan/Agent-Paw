"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PixelCat, type PixelCatHandle } from "@/components/pet/PixelCat";
import { PetBubble, type BubbleKind } from "@/components/pet-companion/bubbles";
import { MetricWidget } from "@/components/pet-companion/widgets";
import { SettingsPanel } from "@/components/pet-companion/SettingsPanel";
import { VoicePanel } from "@/components/pet-companion/voice/VoicePanel";
import { useVoiceCompanion } from "@/companion-pet/voice/useVoiceCompanion";
import { EmotionEngine, getEmotion } from "@/companion-pet/emotions";
import { getReaction } from "@/companion-pet/reactions";
import { speak } from "@/companion-pet/dialogue";
import { allMetrics } from "@/companion-pet/metrics";
import { AchievementTracker } from "@/companion-pet/achievements";
import { createWorldSource, levelFromXp } from "@/companion-pet/world";
import { petSettingsStore, usePetSettings } from "@/companion-pet/settings";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { DevEvent, EmotionId, WorldSnapshot, FormatHelpers } from "@/companion-pet/types";

/* ============================================================
   PetStage — the cat IS the interface. Orchestrates:
   world source → reactions → emotion FSM → cat engine,
   dialogue → bubbles, world → floating widgets, XP → bar,
   achievements → toasts. No dashboard; everything orbits the pet.
   ============================================================ */

interface ActiveBubble {
  id: number;
  kind: BubbleKind;
  text: string;
}

interface Toast {
  id: number;
  icon: string;
  title: string;
  blurb: string;
}

const THEME_STAGE: Record<string, string> = {
  midnight: "bg-bg-2",
  terminal: "bg-[#04120a]",
  paper: "bg-[#141210]",
};

let uid = 0;

export function PetStage() {
  const settings = usePetSettings((s) => s);
  const systemReducedMotion = usePrefersReducedMotion();
  const reducedMotion = systemReducedMotion || settings.reducedMotionOverride;

  const catRef = useRef<PixelCatHandle>(null);
  const [emotionId, setEmotionId] = useState<EmotionId>("idle");
  const [bubble, setBubble] = useState<ActiveBubble | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [world, setWorld] = useState<WorldSnapshot | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [xp, setXp] = useState(0);

  const fsm = useMemo(() => new EmotionEngine(), []);
  const tracker = useMemo(() => new AchievementTracker(), []);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const particleTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const worldRef = useRef<WorldSnapshot | null>(null);
  const lastActivity = useRef(Date.now());

  /* ---------- emotion FSM → cat engine + particles ---------- */
  useEffect(() => {
    const unsubscribe = fsm.subscribe(({ emotion }) => {
      setEmotionId(emotion.id);

      const engine = catRef.current?.engine;
      if (engine) {
        if (emotion.entry === "jump") engine.jump();
        if (emotion.entry === "stretch") engine.stretch(2);
        if (emotion.entry === "meow") engine.meow();
      }

      // Sustained emotion particles (hearts while happy, zzz while sleeping…)
      clearInterval(particleTimer.current);
      if (emotion.particles && settingsRefValue().particles && !reducedMotion) {
        const { kind, every = 1200, count = 1 } = emotion.particles;
        const intensity = intensityFactor(settingsRefValue().animationIntensity);
        particleTimer.current = setInterval(
          () => catRef.current?.engine?.emitParticles(kind, count),
          every / intensity,
        );
      }

      // Sound hooks: intentionally a no-op unless the user enables sounds
      // AND a sound pack registers itself (see docs/COMPANION_PET.md).
      if (settingsRefValue().sounds && emotion.soundHook) {
        window.dispatchEvent(
          new CustomEvent("pet:sound", { detail: { hook: emotion.soundHook } }),
        );
      }
    });
    return () => {
      unsubscribe();
      clearInterval(particleTimer.current);
    };
  }, [fsm, reducedMotion]);

  const settingsRefValue = () => petSettingsStore.get();

  /* ---------- bubbles ---------- */
  const showBubble = useCallback((kind: BubbleKind, text: string, holdMs = 3600) => {
    clearTimeout(bubbleTimer.current);
    setBubble({ id: ++uid, kind, text });
    bubbleTimer.current = setTimeout(() => setBubble(null), holdMs);
  }, []);

  /* ---------- dev events → reactions ---------- */
  const handleEvent = useCallback(
    (event: DevEvent) => {
      const s = settingsRefValue();
      const reaction = getReaction(event.type);
      if (!reaction || !s.reactionGroups[reaction.group]) return;

      fsm.set(reaction.emotion, event.type);

      if (reaction.xp) setXp((v) => v + (reaction.xp ?? 0));

      if (reaction.particles && s.particles && !reducedMotion) {
        catRef.current?.engine?.emitParticles(reaction.particles.kind, reaction.particles.count);
      }

      if (reaction.bubble !== "none") {
        // Critical info always shows; chatter respects reaction frequency.
        const critical = reaction.emotion === "overheated" || reaction.emotion === "worried";
        if (critical || Math.random() <= s.reactionFrequency) {
          const line = speak(s.personality, reaction.dialogueKey);
          if (line) {
            const text = event.detail ? `${line} (${event.detail})` : line;
            showBubble(reaction.bubble, text);
          }
        }
      }

      // Achievements
      if (worldRef.current) {
        for (const unlocked of tracker.onEvent(event, worldRef.current)) {
          const toastId = ++uid;
          setXp((v) => v + 20);
          setToasts((t) => [
            ...t.slice(-2),
            { id: toastId, icon: unlocked.icon, title: unlocked.title, blurb: unlocked.blurb },
          ]);
          fsm.set("celebrating", "achievement");
          if (s.particles && !reducedMotion)
            catRef.current?.engine?.emitParticles("sparkle", 8);
          setTimeout(
            () => setToasts((t) => t.filter((toast) => toast.id !== toastId)),
            5200,
          );
        }
      }
    },
    [fsm, reducedMotion, showBubble, tracker],
  );

  /* ---------- world source (mock or live WS) ---------- */
  useEffect(() => {
    const source = createWorldSource(settings.dailyTokenBudget, settings.tempo);
    const stop = source.start({
      onEvent: handleEvent,
      onWorld: (w) => {
        worldRef.current = w;
        setWorld(w);
      },
    });
    return stop;
    // Recreate only when budget/tempo change — not on every settings tweak.
  }, [handleEvent, settings.dailyTokenBudget, settings.tempo]);

  /* ---------- user presence: idle → sleeping ---------- */
  useEffect(() => {
    const wake = () => {
      const wasAsleep = fsm.currentId === "sleeping";
      lastActivity.current = Date.now();
      if (wasAsleep) {
        fsm.set("greeting", "user-back");
        const line = speak(settingsRefValue().personality, "user.active");
        if (line) showBubble("speech", line);
      }
    };
    const idleCheck = setInterval(() => {
      const idleMs = Date.now() - lastActivity.current;
      if (idleMs > settingsRefValue().idleToSleepMinutes * 60_000 && fsm.currentId !== "sleeping") {
        fsm.set("sleeping", "user-idle");
      }
    }, 5000);
    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("keydown", wake);
    return () => {
      clearInterval(idleCheck);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [fsm, showBubble]);

  /* ---------- formatting helpers ---------- */
  const fmt = useMemo<FormatHelpers>(
    () => ({
      num: (n) => n.toLocaleString(),
      time: (total) => {
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const sec = Math.floor(total % 60);
        return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(sec).padStart(2, "0")}s`;
      },
      clock: (d) =>
        d.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: settings.timeFormat === "12h",
        }),
    }),
    [settings.timeFormat],
  );

  /* ---------- enabled metrics split into left/right columns ---------- */
  const enabledMetrics = useMemo(
    () => allMetrics().filter((m) => settings.metrics[m.id]),
    [settings.metrics],
  );
  const leftMetrics = enabledMetrics.filter((_, i) => i % 2 === 0);
  const rightMetrics = enabledMetrics.filter((_, i) => i % 2 === 1);

  const emotion = getEmotion(emotionId);
  const level = levelFromXp(xp);
  const petting = useRef(0);

  /* ---------- voice companion ---------- */
  const voiceApi = useVoiceCompanion({
    world,
    onEmotion: (id, reason) => fsm.set(id, reason),
    onSpeakingTick: () => {
      // Musical note per spoken word-ish boundary (throttled by intensity).
      const s = petSettingsStore.get();
      if (s.particles && !reducedMotion && Math.random() < 0.35)
        catRef.current?.engine?.emitParticles("note", 1);
    },
  });

  const catColumn = settings.position === "left" ? "order-first" : settings.position === "right" ? "order-last" : "";

  return (
    <div
      className={`relative flex min-h-[calc(100vh-90px)] flex-col overflow-hidden ${THEME_STAGE[settings.theme] ?? "bg-bg-2"}`}
    >
      {/* Top strip: emotion + level + settings */}
      <div className="relative z-20 flex items-center justify-between border-b border-line px-4 py-2">
        <span className="pixel-heading flex items-center gap-2 text-[11px] tracking-[0.2em] text-fg-dim">
          <span className="size-1.5 animate-pulse rounded-full bg-pop" aria-hidden="true" />
          {emotion.id.toUpperCase()}
          {world && (
            <span className="ml-2 border border-line px-1.5 py-0.5 text-[9px]">
              {world.mode === "mock" ? "SIMULATED" : "LIVE"}
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <span className="pixel-heading text-[11px] tracking-[0.14em] text-pop">
            LV.{level.level}
          </span>
          <div className="h-2 w-28 border border-line bg-bg" aria-label={`Level ${level.level}`}>
            <motion.div
              className="h-full bg-pop"
              animate={{ width: `${Math.round((level.into / level.needed) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open pet settings"
            className="focus-pixel cursor-pointer border border-line px-2.5 py-1 text-[13px] text-fg-dim transition-colors hover:border-fg hover:text-fg"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Main stage */}
      <div className="relative z-10 grid flex-1 grid-cols-1 gap-3 p-3 sm:p-5 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_minmax(180px,1fr)]">
        {/* Left widget rail */}
        <div className="pointer-events-none z-20 hidden flex-col justify-center gap-2.5 lg:flex">
          <AnimatePresence>
            {world &&
              leftMetrics.map((def) => (
                <MetricWidget
                  key={def.id}
                  def={def}
                  value={def.read(world, fmt)}
                  large={settings.largeText}
                />
              ))}
          </AnimatePresence>
        </div>

        {/* The pet */}
        <div className={`relative flex flex-col ${catColumn}`}>
          {/* Bubble anchored above the cat */}
          <div className="flex h-[110px] items-end justify-center">
            <AnimatePresence mode="wait">
              {bubble && (
                <PetBubble
                  key={bubble.id}
                  kind={bubble.kind}
                  text={bubble.text}
                  style={settings.bubbleStyle}
                  large={settings.largeText}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="stage-grid relative min-h-[320px] flex-1 cursor-crosshair border-2 border-line">
            <PixelCat
              ref={catRef}
              mode={emotion.catMode}
              variant={settings.variant}
              scale={settings.scale}
              jumpOnClick
              onMeow={() => {
                // Petting feedback: occasional purr line.
                petting.current += 1;
                if (petting.current % 3 === 0) {
                  const line = speak(petSettingsStore.get().personality, "pet.petted");
                  if (line) showBubble("speech", line, 2200);
                }
              }}
              ariaLabel={`Companion pet, feeling ${emotion.id}`}
            />
          </div>

          {/* Voice controls under the cat */}
          <VoicePanel api={voiceApi} />

          {/* Mobile widget shelf */}
          {world && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden">
              {enabledMetrics.slice(0, 6).map((def) => (
                <MetricWidget
                  key={def.id}
                  def={def}
                  value={def.read(world, fmt)}
                  large={settings.largeText}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right widget rail */}
        <div className="pointer-events-none z-20 hidden flex-col justify-center gap-2.5 lg:flex">
          <AnimatePresence>
            {world &&
              rightMetrics.map((def) => (
                <MetricWidget
                  key={def.id}
                  def={def}
                  value={def.read(world, fmt)}
                  large={settings.largeText}
                />
              ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Achievement toasts */}
      <div className="pointer-events-none absolute right-4 top-14 z-30 flex w-[260px] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="border-2 border-pop bg-bg px-3 py-2.5 shadow-[4px_4px_0_0_rgba(255,210,63,0.35)]"
            >
              <p className="pixel-heading text-[12px] tracking-[0.12em] text-pop">
                {toast.icon} {toast.title}
              </p>
              <p className="mt-0.5 text-[11px] text-fg-dim">{toast.blurb}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

const intensityFactor = (intensity: string): number =>
  intensity === "low" ? 0.5 : intensity === "high" ? 1.8 : 1;
