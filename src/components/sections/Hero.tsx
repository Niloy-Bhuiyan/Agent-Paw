"use client";

import { motion } from "framer-motion";
import { PixelCat } from "@/components/pet/PixelCat";
import { useLanguage } from "@/contexts/LanguageContext";
import { staggerChildren, titleLine, fadeUp } from "@/animations/variants";

const AGENTS = ["Claude Code CLI", "Codex CLI", "Cursor", "Antigravity", "Kiro"];

export function Hero() {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative z-10 mx-auto max-w-[1400px] px-5 pb-20 pt-[clamp(60px,9vw,120px)] sm:px-10 lg:px-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div initial="hidden" animate="visible" variants={staggerChildren(0.12)}>
          <h1 className="pixel-heading text-[clamp(38px,6.2vw,76px)] leading-[1.12] tracking-[0.02em]">
            {(["hero.title.1", "hero.title.2", "hero.title.3"] as const).map((key) => (
              <span key={key} className="block overflow-hidden">
                <motion.span variants={titleLine} className="block">
                  {t(key)}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-[560px] text-[15px] leading-relaxed text-fg-dim"
          >
            {t("hero.lede")}
          </motion.p>

          <motion.p variants={fadeUp} className="mt-6 text-[13px] leading-loose">
            <strong className="pixel-heading tracking-[0.14em] text-pop">
              {t("hero.agent.label")}
            </strong>
            <span className="mt-2 flex flex-wrap gap-2">
              {AGENTS.map((agent) => (
                <b
                  key={agent}
                  className="border border-line bg-bg-2 px-2 py-0.5 font-normal text-fg-dim"
                >
                  {agent}
                </b>
              ))}
            </span>
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-5">
            <a
              href="#motions"
              className="focus-pixel pixel-heading inline-flex cursor-pointer items-center gap-3 border-2 border-fg bg-fg px-6 py-4 text-[19px] tracking-[0.12em] text-bg shadow-[4px_4px_0_0_#0a0a0a,4px_4px_0_1px_#f5f5f5] transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {t("hero.cta.see")}
              <span aria-hidden="true" className="animate-blink-hint">
                ↓
              </span>
            </a>
            <span className="pixel-heading border-2 border-line px-4 py-3 text-[15px] tracking-[0.14em] text-fg-dim">
              #1 PRODUCT OF THE DAY ★
            </span>
          </motion.div>
        </motion.div>

        {/* Terminal-style frame with a live cat instead of a video */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          aria-label="AgentPaw live demo"
        >
          <div className="flex aspect-square flex-col border-2 border-fg bg-bg-2 shadow-[4px_4px_0_0_#f5f5f5]">
            <div className="flex items-center gap-2 border-b-2 border-fg px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[12px] tracking-[0.08em] text-fg-dim">
                {t("hero.frame.title")}
              </span>
            </div>
            <div className="stage-grid relative flex-1 cursor-crosshair overflow-hidden">
              <PixelCat
                variant="orange"
                mode="auto"
                interactive
                jumpOnClick
                scale={0.4}
                ariaLabel="AgentPaw wandering around a desktop"
              />
              <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] tracking-[0.1em] text-fg-dim/70">
                {t("hero.frame.hint")}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
