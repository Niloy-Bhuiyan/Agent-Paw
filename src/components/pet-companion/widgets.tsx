"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { MetricDef, MetricValue } from "@/companion-pet/types";

/* ============================================================
   Floating metric widgets — tiny pixel cards, bars and
   sparklines that orbit the pet. Memoized so only widgets whose
   value text actually changed re-render.
   ============================================================ */

const toneCls: Record<NonNullable<MetricValue["tone"]> | "none", string> = {
  ok: "text-[#28c840]",
  warn: "text-pop",
  bad: "text-[#e2574c]",
  none: "text-fg",
};

const barTone: Record<NonNullable<MetricValue["tone"]> | "none", string> = {
  ok: "bg-[#28c840]",
  warn: "bg-pop",
  bad: "bg-[#e2574c]",
  none: "bg-fg",
};

interface WidgetProps {
  def: MetricDef;
  value: MetricValue;
  large: boolean;
}

export const MetricWidget = memo(
  function MetricWidget({ def, value, large }: WidgetProps) {
    const tone = value.tone ?? "none";
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -6 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="pointer-events-auto w-full border-2 border-line bg-bg/90 px-3 py-2 backdrop-blur-[2px] transition-colors hover:border-fg"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-[13px]">
            {def.icon}
          </span>
          <span
            className={`pixel-heading flex-1 truncate tracking-[0.14em] text-fg-dim ${
              large ? "text-[11px]" : "text-[9.5px]"
            }`}
          >
            {def.label.toUpperCase()}
          </span>
        </div>

        <div className={`mt-1 font-mono ${large ? "text-[14px]" : "text-[12px]"} ${toneCls[tone]}`}>
          {value.text}
        </div>

        {def.style === "bar" && (
          <div className="mt-1.5 h-1.5 w-full border border-line bg-bg">
            <motion.div
              className={`h-full ${barTone[tone]}`}
              animate={{ width: `${Math.round((value.ratio ?? 0) * 100)}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        )}

        {def.style === "chart" && value.series && <Sparkline series={value.series} tone={tone} />}
      </motion.div>
    );
  },
  (prev, next) =>
    prev.large === next.large &&
    prev.value.text === next.value.text &&
    prev.value.ratio === next.value.ratio &&
    prev.value.tone === next.value.tone &&
    prev.value.series === next.value.series,
);

function Sparkline({ series, tone }: { series: number[]; tone: keyof typeof toneCls }) {
  if (series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const w = 96;
  const h = 22;
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stroke = tone === "bad" ? "#e2574c" : tone === "warn" ? "#ffd23f" : "#28c840";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-1.5 h-[22px] w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}
