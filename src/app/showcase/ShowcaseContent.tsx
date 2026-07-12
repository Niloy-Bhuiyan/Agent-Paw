"use client";

import { motion } from "framer-motion";
import { PixelCat } from "@/components/pet/PixelCat";
import { CAT_VARIANTS } from "@/animations/pixel-cat/palettes";
import { useLanguage } from "@/contexts/LanguageContext";
import { cardPop, fadeUp, staggerChildren } from "@/animations/variants";
import type { CatMode } from "@/types";

const SHOWCASE_MODES: readonly CatMode[] = ["sit", "auto", "sleep", "walk", "knead", "auto"];

export function ShowcaseContent() {
  const { t } = useLanguage();

  return (
    <main className="relative z-10 mx-auto max-w-[1200px] px-5 py-20 sm:px-10">
      <motion.div initial="hidden" animate="visible" variants={staggerChildren(0.1)}>
        <motion.h1
          variants={fadeUp}
          className="pixel-heading text-center text-[clamp(32px,5vw,52px)]"
        >
          {t("showcase.title")}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-4 text-center text-[14px] text-fg-dim">
          {t("showcase.sub")}
        </motion.p>
      </motion.div>

      <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {CAT_VARIANTS.map((variant, i) => (
          <motion.article
            key={variant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardPop}
            className="border-2 border-fg bg-bg-2 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#ffd23f]"
          >
            <div className="stage-grid aspect-square cursor-crosshair">
              <PixelCat
                variant={variant}
                mode={SHOWCASE_MODES[i % SHOWCASE_MODES.length] ?? "sit"}
                scale={0.5}
                jumpOnClick
                ariaLabel={`${variant} pixel cat`}
              />
            </div>
            <p className="pixel-heading border-t-2 border-fg px-4 py-3 text-[16px] uppercase tracking-[0.2em] text-fg-dim">
              {variant}
            </p>
          </motion.article>
        ))}
      </div>
    </main>
  );
}
