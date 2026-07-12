"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PixelCat, type PixelCatHandle } from "@/components/pet/PixelCat";
import { SpeechBubble } from "@/components/pet/SpeechBubble";
import { CAT_VARIANTS, nextVariant } from "@/animations/pixel-cat/palettes";
import { useLanguage } from "@/contexts/LanguageContext";
import { clamp } from "@/utils/math";
import type { CatVariant } from "@/types";
import type { DemoKind } from "@/components/sections/motions-data";

interface MotionDemoProps {
  kind: DemoKind;
  variant?: CatVariant;
}

/**
 * One live, interactive demo per motion card. Every demo reuses the same
 * PixelCat engine with a different behavior mode plus small DOM overlays.
 */
export function MotionDemo({ kind, variant = "orange" }: MotionDemoProps) {
  switch (kind) {
    case "pattern":
      return <PatternDemo />;
    case "eyes":
      return <PixelCat mode="eyes" variant={variant} scale={0.5} ariaLabel="Cat following the cursor with its eyes" />;
    case "mochi":
      return <PixelCat mode="sit" variant="gray" draggable scale={0.48} ariaLabel="Draggable mochi cat" />;
    case "hunt":
      return <PixelCat mode="hunt" variant="brown" scale={0.42} ariaLabel="Cat hunting the cursor" />;
    case "purr":
      return <PixelCat mode="sit" variant={variant} scale={0.52} ariaLabel="Cat that purrs when petted" />;
    case "knead":
      return <KeyReactiveDemo mode="knead" variant="mixed" />;
    case "overheat":
      return <KeyReactiveDemo mode="overheat" variant="orange" />;
    case "stretch":
      return <StretchDemo />;
    case "paper":
      return <PaperDemo />;
    case "think":
      return <ThinkDemo />;
    case "celebrate":
      return <CelebrateDemo />;
    case "pomodoro":
      return <PomodoroDemo />;
    case "reminder":
      return <ReminderDemo />;
    case "fixed-message":
      return <FixedMessageDemo />;
    case "tell-name":
      return <TellNameDemo />;
    case "multi":
      return <MultiDeviceDemo />;
    case "peek":
      return <PixelCat mode="peek" variant="black" scale={0.5} ariaLabel="Cat peeking from the edge" />;
  }
}

/* ---------- 01 · fur pattern ---------- */

function PatternDemo() {
  const [variant, setVariant] = useState<CatVariant>("orange");

  useEffect(() => {
    const id = window.setInterval(() => setVariant((v) => nextVariant(v)), 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      aria-label="Change fur pattern"
      onClick={() => setVariant((v) => nextVariant(v))}
      className="focus-pixel relative h-full w-full cursor-pointer"
    >
      <PixelCat mode="sit" variant={variant} scale={0.52} interactive={false} />
      <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {CAT_VARIANTS.map((v) => (
          <span
            key={v}
            className={`size-2 border border-fg/60 ${v === variant ? "bg-pop" : "bg-transparent"}`}
          />
        ))}
      </span>
    </button>
  );
}

/* ---------- 06/07 · keyboard-reactive (knead + overheat) ---------- */

function KeyReactiveDemo({ mode, variant }: { mode: "knead" | "overheat"; variant: CatVariant }) {
  const catRef = useRef<PixelCatHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let listening = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      catRef.current?.engine?.tap();
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !listening) {
            document.addEventListener("keydown", onKey);
            listening = true;
          } else if (!entry.isIntersecting && listening) {
            document.removeEventListener("keydown", onKey);
            listening = false;
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="h-full w-full"
      onPointerDown={() => catRef.current?.engine?.tap(1.4)}
    >
      <PixelCat
        ref={catRef}
        mode={mode}
        variant={variant}
        scale={0.5}
        ariaLabel={mode === "knead" ? "Cat kneading along with keystrokes" : "Cat overheating from fast typing"}
      />
    </div>
  );
}

/* ---------- 08 · stretch reminder ---------- */

function StretchDemo() {
  const catRef = useRef<PixelCatHandle>(null);
  const { t } = useLanguage();
  const [stretching, setStretching] = useState(false);

  const doStretch = () => {
    if (stretching) return;
    catRef.current?.engine?.stretch(1.8);
    setStretching(true);
    window.setTimeout(() => setStretching(false), 1800);
  };

  return (
    <div className="relative h-full w-full">
      <PixelCat ref={catRef} mode="stretch" variant="white" scale={stretching ? 0.72 : 0.5} ariaLabel="Cat stretching tall" />
      <button
        type="button"
        onClick={doStretch}
        className="focus-pixel pixel-heading absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer border-2 border-fg bg-bg px-3 py-1.5 text-[14px] tracking-[0.12em] text-fg transition-colors hover:bg-fg hover:text-bg"
      >
        {stretching ? "…" : t("motion.reminder.btn")}
      </button>
    </div>
  );
}

/* ---------- 09 · paper unroll ---------- */

function PaperDemo() {
  const catRef = useRef<PixelCatHandle>(null);
  const [roll, setRoll] = useState(0.25);
  const decay = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      decay.current += 1;
      if (decay.current > 4) setRoll((r) => Math.max(0.25, r - 0.06));
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const unroll = (amount: number) => {
    decay.current = 0;
    setRoll((r) => clamp(r + amount, 0.25, 1));
    catRef.current?.engine?.tap();
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onWheel={(e) => unroll(Math.abs(e.deltaY) * 0.0015)}
      onPointerMove={(e) => {
        if (e.buttons > 0) unroll(Math.abs(e.movementY) * 0.004);
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[62%]">
        <PixelCat ref={catRef} mode="knead" variant="orange" scale={0.78} ariaLabel="Cat unrolling paper" />
      </div>
      {/* Paper strip */}
      <div className="absolute bottom-0 left-1/2 w-[38%] -translate-x-1/2">
        <div
          className="mx-auto w-full border-2 border-fg/70 bg-fg transition-[height] duration-150 ease-out"
          style={{ height: `${roll * 90}px` }}
        >
          <div className="h-full w-full bg-[repeating-linear-gradient(180deg,transparent_0,transparent_10px,rgba(10,10,10,0.15)_10px,rgba(10,10,10,0.15)_12px)]" />
        </div>
        <div className="mx-auto h-3 w-[116%] -translate-x-[7%] border-2 border-fg bg-fg-dim" />
      </div>
    </div>
  );
}

/* ---------- 10 · thinking along ---------- */

function ThinkDemo() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = window.setInterval(() => setDots((d) => (d % 3) + 1), 450);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full">
      <PixelCat mode="think" variant="gray" scale={0.5} interactive={false} ariaLabel="Cat thinking" />
      <SpeechBubble>
        <span className="pixel-heading text-[16px] tracking-[0.3em]">
          {".".repeat(dots)}
          <span className="opacity-0">{".".repeat(3 - dots)}</span>
        </span>
      </SpeechBubble>
    </div>
  );
}

/* ---------- 11 · agent done jump ---------- */

function CelebrateDemo() {
  const [phase, setPhase] = useState<"think" | "done">("think");

  useEffect(() => {
    let alive = true;
    const cycle = () => {
      if (!alive) return;
      setPhase("think");
      window.setTimeout(() => {
        if (!alive) return;
        setPhase("done");
        window.setTimeout(cycle, 2600);
      }, 2600);
    };
    cycle();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <PixelCat
        mode={phase === "think" ? "think" : "celebrate"}
        variant="orange"
        scale={0.48}
        interactive={false}
        ariaLabel="Cat celebrating a finished task"
      />
      <AnimatePresence mode="wait">
        {phase === "done" ? (
          <SpeechBubble key="done">
            <span className="pixel-heading text-[15px] tracking-[0.1em] text-pop">MEOW! DONE ✓</span>
          </SpeechBubble>
        ) : (
          <SpeechBubble key="think">
            <span className="text-fg-dim">agent working…</span>
          </SpeechBubble>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 12 · pomodoro ---------- */

function PomodoroDemo() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 1 ? 25 * 60 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <button
      type="button"
      aria-label="Toggle pomodoro timer"
      onClick={() => setRunning((r) => !r)}
      className="focus-pixel relative h-full w-full cursor-pointer"
    >
      <PixelCat mode={running ? "sit" : "sleep"} variant="brown" scale={0.48} interactive={false} />
      <span
        className={`pixel-heading absolute right-[8%] top-[16%] border-2 border-fg bg-bg px-3 py-1.5 text-[22px] tracking-[0.14em] ${
          running ? "text-pop" : "text-fg-dim"
        }`}
      >
        {mm}:{ss}
      </span>
      <span className="pixel-heading absolute bottom-3 left-1/2 -translate-x-1/2 text-[12px] tracking-[0.2em] text-fg-dim">
        {running ? "FOCUS" : "PAUSED"}
      </span>
    </button>
  );
}

/* ---------- 13 · message reminder ---------- */

function ReminderDemo() {
  const [show, setShow] = useState(false);
  const catRef = useRef<PixelCatHandle>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setShow(true);
      catRef.current?.engine?.meow();
      window.setTimeout(() => setShow(false), 2600);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full">
      <PixelCat ref={catRef} mode="sit" variant="white" scale={0.5} ariaLabel="Cat delivering a reminder" />
      <AnimatePresence>
        {show && (
          <SpeechBubble>
            <span>
              14:00 — <b className="text-pop">water break!</b>
            </span>
          </SpeechBubble>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 14 · fixed message ---------- */

function FixedMessageDemo() {
  return (
    <div className="relative h-full w-full">
      <PixelCat mode="sit" variant="black" scale={0.5} ariaLabel="Cat holding a pinned note" />
      <SpeechBubble>
        <span className="flex items-center gap-2">
          <span aria-hidden="true">📌</span> ship v1.0 today
        </span>
      </SpeechBubble>
    </div>
  );
}

/* ---------- 15 · tell your name ---------- */

function TellNameDemo() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const catRef = useRef<PixelCatHandle>(null);

  return (
    <div className="relative h-full w-full">
      <PixelCat ref={catRef} mode="sit" variant="mixed" scale={0.46} ariaLabel="Cat greeting you by name" />
      <AnimatePresence>
        {name.trim() && (
          <SpeechBubble>
            <span>
              hi, <b className="text-pop">{name.trim().slice(0, 14)}</b>! ♥
            </span>
          </SpeechBubble>
        )}
      </AnimatePresence>
      <input
        type="text"
        value={name}
        maxLength={14}
        placeholder={t("motion.tellName.hint")}
        onChange={(e) => {
          setName(e.target.value);
          catRef.current?.engine?.tap();
        }}
        aria-label="Your name"
        className="focus-pixel absolute bottom-3 left-1/2 w-[70%] -translate-x-1/2 border-2 border-fg bg-bg px-3 py-1.5 text-center font-mono text-[12px] text-fg placeholder:text-fg-dim/60"
      />
    </div>
  );
}

/* ---------- 16 · multi-device ---------- */

function MultiDeviceDemo() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-4 p-6">
      {(["macbook", "desktop"] as const).map((device, i) => (
        <div key={device} className="flex w-[42%] flex-col">
          <div className="stage-grid aspect-square border-2 border-fg bg-bg-2">
            <PixelCat
              mode={i === 0 ? "sit" : "sleep"}
              variant="orange"
              scale={0.62}
              interactive={false}
              ariaLabel={`Cat on ${device}`}
            />
          </div>
          <div className="mx-auto h-2 w-1/2 border-x-2 border-b-2 border-fg bg-bg-2" />
          <span className="pixel-heading mt-2 text-center text-[11px] tracking-[0.2em] text-fg-dim">
            {device === "macbook" ? "MACBOOK" : "DESKTOP"}
          </span>
        </div>
      ))}
    </div>
  );
}
