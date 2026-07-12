"use client";

import { useEffect, useRef, useState } from "react";
import { PixelCat, type PixelCatHandle } from "@/components/pet/PixelCat";
import { companionBus } from "@/lib/events/bus";
import { useCompanionStore } from "@/lib/store/companionStore";
import type { CatMode } from "@/types";

/**
 * The companion's cat, driven by the event bus:
 * chat thinking → think · streaming → knead · done → celebrate ·
 * error → overheat · agents working (while chat idle) → think.
 */
export function CompanionCatStage() {
  const chatStatus = useCompanionStore((s) => s.status);
  const agents = useCompanionStore((s) => s.agents);
  const [mode, setMode] = useState<CatMode>("auto");
  const catRef = useRef<PixelCatHandle>(null);
  const revertTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Chat lifecycle reactions (celebration is transient, then back to auto).
  useEffect(() => {
    const offs = [
      companionBus.on("chat:done", () => {
        clearTimeout(revertTimer.current);
        setMode("celebrate");
        catRef.current?.engine?.jump();
        revertTimer.current = setTimeout(() => setMode("auto"), 2600);
      }),
      companionBus.on("chat:error", () => {
        clearTimeout(revertTimer.current);
        setMode("overheat");
        catRef.current?.engine?.tap(4);
        revertTimer.current = setTimeout(() => setMode("auto"), 3200);
      }),
    ];
    return () => {
      offs.forEach((off) => off());
      clearTimeout(revertTimer.current);
    };
  }, []);

  // Continuous states derived from store status.
  useEffect(() => {
    if (chatStatus === "thinking") setMode("think");
    else if (chatStatus === "streaming") setMode("knead");
    else if (chatStatus === "idle") {
      setMode((current) =>
        current === "think" || current === "knead" ? "auto" : current,
      );
    }
  }, [chatStatus]);

  // While the chat is idle, mirror agent activity (the app's signature feature).
  const anyAgentWorking = agents.some((a) => a.status === "thinking" || a.status === "working");
  useEffect(() => {
    if (chatStatus !== "idle") return;
    setMode((current) => {
      if (anyAgentWorking && current === "auto") return "think";
      if (!anyAgentWorking && current === "think") return "auto";
      return current;
    });
  }, [anyAgentWorking, chatStatus]);

  return (
    <div className="stage-grid relative aspect-square w-full cursor-crosshair overflow-hidden border-2 border-fg bg-bg-2">
      <PixelCat
        ref={catRef}
        mode={mode}
        variant="orange"
        scale={0.46}
        jumpOnClick
        ariaLabel="Your companion cat reacting to chat and agent activity"
      />
      <span className="pixel-heading pointer-events-none absolute left-2 top-2 border border-line bg-bg/80 px-2 py-1 text-[10px] tracking-[0.18em] text-fg-dim">
        {mode.toUpperCase()}
      </span>
    </div>
  );
}
