"use client";

import { motion } from "framer-motion";
import type { BubbleStyle } from "@/companion-pet/settings";

/* ============================================================
   The pet's ways of "speaking": speech bubble, thought bubble,
   pixel sign, and sticky note. All enter/exit with springy
   motion and are pinned relative to the cat by the stage.
   ============================================================ */

export type BubbleKind = "speech" | "thought" | "sign" | "note";

const pop = {
  initial: { opacity: 0, y: 10, scale: 0.85 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.9 },
  transition: { type: "spring" as const, stiffness: 420, damping: 26 },
};

interface BubbleProps {
  kind: BubbleKind;
  text: string;
  style: BubbleStyle;
  large?: boolean;
}

export function PetBubble({ kind, text, style, large }: BubbleProps) {
  const textCls = `${large ? "text-[15px]" : "text-[13px]"} leading-snug`;
  const rounded = style === "round";

  if (kind === "sign") {
    return (
      <motion.div {...pop} className="flex flex-col items-center">
        <div
          className={`pixel-heading border-[3px] border-fg bg-pop px-4 py-2 text-[14px] tracking-[0.08em] text-bg shadow-[4px_4px_0_0_rgba(245,245,245,0.4)] ${
            rounded ? "rounded-lg" : ""
          }`}
        >
          {text}
        </div>
        <div className="h-5 w-1.5 bg-fg" aria-hidden="true" />
      </motion.div>
    );
  }

  if (kind === "note") {
    return (
      <motion.div
        {...pop}
        animate={{ ...pop.animate, rotate: -3 }}
        className={`max-w-[240px] border border-[#d9c76a] bg-[#f5e79a] px-3.5 py-2.5 font-mono text-[12px] leading-snug text-[#3a3212] shadow-[3px_4px_0_0_rgba(0,0,0,0.35)] ${
          rounded ? "rounded-md" : ""
        }`}
      >
        <span aria-hidden="true" className="mb-1 block text-center text-[10px] opacity-50">
          ● ● ●
        </span>
        {text}
      </motion.div>
    );
  }

  if (kind === "thought") {
    return (
      <motion.div {...pop} className="flex flex-col items-center">
        <div
          className={`max-w-[260px] border-2 border-dashed border-fg-dim bg-bg/95 px-3.5 py-2 text-fg-dim ${textCls} ${
            rounded ? "rounded-2xl" : ""
          }`}
        >
          {text}
        </div>
        <div className="mt-1 flex flex-col items-center gap-1" aria-hidden="true">
          <span className="size-2 rounded-full border border-fg-dim bg-bg" />
          <span className="size-1.5 rounded-full border border-fg-dim bg-bg" />
        </div>
      </motion.div>
    );
  }

  // speech
  return (
    <motion.div {...pop} className="flex flex-col items-center">
      <div
        className={`relative max-w-[280px] border-2 border-fg bg-bg px-4 py-2.5 text-fg shadow-[3px_3px_0_0_rgba(245,245,245,0.35)] ${textCls} ${
          rounded ? "rounded-2xl" : ""
        }`}
      >
        {text}
        <span
          aria-hidden="true"
          className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-fg bg-bg"
        />
      </div>
    </motion.div>
  );
}
