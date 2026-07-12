"use client";

import type { MicLevels } from "@/companion-pet/voice/types";
import type { VoicePhase } from "@/companion-pet/voice/types";

/** Animated bar waveform — live mic bins when available, synthetic otherwise. */
export function Waveform({ levels, phase }: { levels: MicLevels; phase: VoicePhase }) {
  const active = phase === "listening" || phase === "speaking";
  const color =
    phase === "speaking" ? "#ffd23f" : levels.voice && active ? "#28c840" : "#9a9a9a";

  return (
    <div
      className="flex h-8 items-center justify-center gap-[3px]"
      role="img"
      aria-label={active ? "Audio level visualization" : "Microphone idle"}
    >
      {levels.bins.slice(0, 16).map((bin, i) => (
        <span
          key={i}
          className="w-[3px] transition-[height] duration-100 ease-out"
          style={{
            height: `${Math.max(8, Math.min(100, bin * 130))}%`,
            backgroundColor: active ? color : "#3a3a3a",
          }}
        />
      ))}
    </div>
  );
}
