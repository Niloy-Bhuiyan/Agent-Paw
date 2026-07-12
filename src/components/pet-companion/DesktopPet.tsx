"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PixelCat, type PixelCatHandle } from "@/components/pet/PixelCat";
import { SpeechBubble } from "@/components/pet/SpeechBubble";
import { speak } from "@/companion-pet/dialogue";
import { companionMemory } from "@/companion-pet/memory";
import { usePetSettings } from "@/companion-pet/settings";
import { CAT_VARIANTS } from "@/animations/pixel-cat/palettes";
import type { CatMode, CatVariant } from "@/types";

/* ============================================================
   DesktopPet — the content of the transparent Electron window.
   Bare stage: no chrome, no background. The whole window is a
   drag region except the cat itself (so petting still works).
   - click: jump · double-click: cycle fur · right-click: sleep
   - a hover toolbar offers close; idle chatter appears rarely.
   ============================================================ */

const IDLE_LINES = ["user.greeting", "pet.petted", "user.long-session"];

export function DesktopPet() {
  const settings = usePetSettings((s) => s);
  const catRef = useRef<PixelCatHandle>(null);
  const [variant, setVariant] = useState<CatVariant>(settings.variant);
  const [mode, setMode] = useState<CatMode>("auto");
  const [line, setLine] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  // Transparent window: strip page backgrounds while mounted.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.background;
    const prevBody = document.body.style.background;
    html.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.background = prevHtml;
      document.body.style.background = prevBody;
      document.body.style.overflow = "";
    };
  }, []);

  // Rare idle chatter (greeting on open, then every ~50s, 30% chance).
  useEffect(() => {
    const show = (key: string) => {
      const text = speak(settings.personality, key);
      if (!text) return;
      setLine(text);
      setTimeout(() => setLine(null), 4200);
    };
    const hello = setTimeout(() => show("user.greeting"), 1200);
    const chatter = setInterval(() => {
      if (Math.random() < 0.3)
        show(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)] as string);
    }, 50_000);
    return () => {
      clearTimeout(hello);
      clearInterval(chatter);
    };
  }, [settings.personality]);

  const cycleVariant = () => {
    const idx = CAT_VARIANTS.indexOf(variant);
    setVariant(CAT_VARIANTS[(idx + 1) % CAT_VARIANTS.length] as CatVariant);
    catRef.current?.engine?.emitParticles("sparkle", 5);
  };

  const toggleSleep = () => setMode((m) => (m === "sleep" ? "auto" : "sleep"));

  return (
    <div
      className="drag-region relative h-screen w-screen select-none overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Electron drag/no-drag regions */}
      <style>{`
        .drag-region { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Speech bubble above the cat */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[76px] items-end justify-center">
        <AnimatePresence>{line && <SpeechBubble>{line}</SpeechBubble>}</AnimatePresence>
      </div>

      {/* The cat — interactive, so no-drag */}
      <div
        className="no-drag absolute inset-x-0 bottom-0 top-[72px] cursor-crosshair"
        onDoubleClick={cycleVariant}
        onContextMenu={(e) => {
          e.preventDefault();
          toggleSleep();
        }}
      >
        <PixelCat
          ref={catRef}
          mode={mode}
          variant={variant}
          scale={0.62}
          jumpOnClick
          ariaLabel={`${companionMemory.get().companionName}, your desktop pet`}
        />
      </div>

      {/* Hover toolbar */}
      <div
        className={`no-drag absolute right-1 top-1 z-20 flex gap-1 transition-opacity duration-200 ${
          hover ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          title="Sleep / wake (right-click the cat also works)"
          onClick={toggleSleep}
          className="cursor-pointer border border-line bg-bg/90 px-1.5 py-0.5 text-[11px] text-fg-dim hover:text-fg"
        >
          {mode === "sleep" ? "☀" : "🌙"}
        </button>
        <button
          type="button"
          title="Close pet"
          onClick={() => window.close()}
          className="cursor-pointer border border-line bg-bg/90 px-1.5 py-0.5 text-[11px] text-fg-dim hover:text-[#e2574c]"
        >
          ✕
        </button>
      </div>

      {/* Subtle hint on hover */}
      <p
        className={`pointer-events-none absolute bottom-0.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-fg-dim/80 transition-opacity ${
          hover ? "opacity-100" : "opacity-0"
        }`}
      >
        drag edges to move · click jump · 2×click fur · right-click sleep
      </p>
    </div>
  );
}
