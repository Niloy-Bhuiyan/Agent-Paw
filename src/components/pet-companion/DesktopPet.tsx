"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PixelCat, type PixelCatHandle } from "@/components/pet/PixelCat";
import { SpeechBubble } from "@/components/pet/SpeechBubble";
import { speak } from "@/companion-pet/dialogue";
import { companionMemory } from "@/companion-pet/memory";
import { usePetSettings } from "@/companion-pet/settings";
import { CAT_VARIANTS } from "@/animations/pixel-cat/palettes";
import { clamp } from "@/utils/math";
import type { CatMode, CatVariant } from "@/types";

/* ============================================================
   DesktopPet — content of the transparent Electron window.

   Two modes (picked by the shell via ?mode=):
   - roam  : the window covers the whole work area, click-through
             by default. The cat wanders along the bottom of the
             ENTIRE screen; when your pointer nears it, the page
             asks the shell (IPC) to become clickable so you can
             pet / click / drag-free interact, then releases.
   - corner: small draggable window (whole window is a drag region
             except the cat).

   Interactions: click = jump · double-click = next fur ·
   right-click = sleep/wake · hover = toolbar with ✕.
   ============================================================ */

const IDLE_LINES = ["user.greeting", "pet.petted", "user.long-session"];
const ROAM_STRIP_H = 240; // px strip at the bottom of the screen the cat lives in
const NEAR_X = 100; // horizontal "near the cat" radius in px

export function DesktopPet() {
  const settings = usePetSettings((s) => s);
  const catRef = useRef<PixelCatHandle>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [roam, setRoam] = useState(false);
  const [variant, setVariant] = useState<CatVariant>(settings.variant);
  const [mode, setMode] = useState<CatMode>("auto");
  const [line, setLine] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [catX, setCatX] = useState(0);

  // Mode + transparent window: strip page backgrounds while mounted.
  useEffect(() => {
    setRoam(
      new URLSearchParams(window.location.search).get("mode") === "roam" &&
        Boolean(window.petDesktop),
    );
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

  // Roam mode: watch the pointer; flip window interactivity near the cat.
  useEffect(() => {
    if (!roam) return;
    let interactive = false;
    let raf = 0;

    const check = (clientX: number, clientY: number) => {
      const engine = catRef.current?.engine;
      const strip = stripRef.current;
      if (!engine || !strip) return;
      const rect = strip.getBoundingClientRect();
      const pos = engine.getPosition();
      const catScreenX = rect.left + pos.x;
      setCatX(catScreenX);
      const near =
        Math.abs(clientX - catScreenX) < NEAR_X &&
        clientY > rect.top + (rect.height - pos.height - 40);
      if (near !== interactive) {
        interactive = near;
        window.petDesktop?.setInteractive(near);
        setHover(near);
      }
    };

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => check(e.clientX, e.clientY));
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      window.petDesktop?.setInteractive(false);
    };
  }, [roam]);

  // Rare idle chatter (greeting on open, then occasional lines).
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

  const closePet = () => {
    if (window.petDesktop) window.petDesktop.quit();
    else window.close();
  };

  const cat = (
    <PixelCat
      ref={catRef}
      mode={mode}
      variant={variant}
      scale={roam ? 0.62 : 0.62}
      jumpOnClick
      ariaLabel={`${companionMemory.get().companionName}, your desktop pet`}
    />
  );

  /* ---------------- roam layout: cat owns the whole screen bottom ---------------- */
  if (roam) {
    const anchorX = clamp(catX, 130, Math.max(130, (typeof window !== "undefined" ? window.innerWidth : 800) - 130));
    return (
      <div className="relative h-screen w-screen select-none overflow-hidden">
        <style>{`::-webkit-scrollbar { display: none; }`}</style>

        {/* Bubble + toolbar anchored above the cat's current position */}
        <div
          className="pointer-events-none absolute z-10 flex -translate-x-1/2 flex-col items-center gap-1"
          style={{ left: anchorX, bottom: ROAM_STRIP_H - 24 }}
        >
          <AnimatePresence>
            {line && (
              <div className="relative">
                <SpeechBubble>{line}</SpeechBubble>
              </div>
            )}
          </AnimatePresence>
          <div
            className={`pointer-events-auto flex gap-1 transition-opacity duration-200 ${
              hover ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              type="button"
              title="Sleep / wake"
              onClick={toggleSleep}
              className="cursor-pointer border border-line bg-bg/90 px-1.5 py-0.5 text-[11px] text-fg-dim hover:text-fg"
            >
              {mode === "sleep" ? "☀" : "🌙"}
            </button>
            <button
              type="button"
              title="Close pet (Ctrl+Alt+Q)"
              onClick={closePet}
              className="cursor-pointer border border-line bg-bg/90 px-1.5 py-0.5 text-[11px] text-fg-dim hover:text-[#e2574c]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* The strip the cat wanders across — full screen width */}
        <div
          ref={stripRef}
          className="absolute inset-x-0 bottom-0 cursor-crosshair"
          style={{ height: ROAM_STRIP_H }}
          onDoubleClick={cycleVariant}
          onContextMenu={(e) => {
            e.preventDefault();
            toggleSleep();
          }}
        >
          {cat}
        </div>
      </div>
    );
  }

  /* ---------------- corner layout: small draggable window ---------------- */
  return (
    <div
      className="drag-region relative h-screen w-screen select-none overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <style>{`
        .drag-region { -webkit-app-region: drag; }
        .no-drag { -webkit-app-region: no-drag; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[76px] items-end justify-center">
        <AnimatePresence>{line && <SpeechBubble>{line}</SpeechBubble>}</AnimatePresence>
      </div>

      <div
        className="no-drag absolute inset-x-0 bottom-0 top-[72px] cursor-crosshair"
        onDoubleClick={cycleVariant}
        onContextMenu={(e) => {
          e.preventDefault();
          toggleSleep();
        }}
      >
        {cat}
      </div>

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
          onClick={closePet}
          className="cursor-pointer border border-line bg-bg/90 px-1.5 py-0.5 text-[11px] text-fg-dim hover:text-[#e2574c]"
        >
          ✕
        </button>
      </div>

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
