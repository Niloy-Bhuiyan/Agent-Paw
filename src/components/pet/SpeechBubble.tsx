"use client";

import { motion } from "framer-motion";

/** Pixel-styled speech bubble pinned above the cat's head. */
export function SpeechBubble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.9 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
      className={`pointer-events-none absolute left-1/2 top-[12%] z-10 -translate-x-1/2 ${className ?? ""}`}
    >
      <div className="relative border-2 border-fg bg-bg px-3 py-1.5 font-mono text-[12px] tracking-[0.06em] text-fg shadow-[3px_3px_0_0_rgba(245,245,245,0.35)]">
        {children}
        <span
          aria-hidden="true"
          className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-fg bg-bg"
        />
      </div>
    </motion.div>
  );
}
