"use client";

import { motion } from "framer-motion";
import { MotionDemo } from "@/components/pet/MotionDemo";
import { MOTION_CARDS, type MotionCardDef } from "@/components/sections/motions-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { site } from "@/lib/config";
import { cardPop, fadeUp, staggerChildren } from "@/animations/variants";

export function MotionsSection() {
  const { t } = useLanguage();

  return (
    <section id="motions" className="relative z-10 mx-auto max-w-[1200px] px-5 py-20 sm:px-10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={staggerChildren(0.1)}
        className="text-center"
      >
        <motion.h2
          variants={fadeUp}
          className="pixel-heading text-[clamp(30px,4.4vw,52px)] leading-tight"
        >
          {t("motions.title")}
        </motion.h2>
        <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-[620px] text-[14px] text-fg-dim">
          {t("motions.sub")}
        </motion.p>
      </motion.div>

      <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {MOTION_CARDS.map((card, i) => (
          <MotionCard key={card.id} card={card} index={i + 1} />
        ))}
      </div>

      <p className="pixel-heading mt-14 text-center text-[clamp(18px,1.8vw,22px)] tracking-[0.06em] text-fg-dim">
        {t("motions.more")}
      </p>

      <nav
        aria-label="AgentPaw social links"
        className="mt-8 flex items-center justify-center gap-8"
      >
        {site.socials.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-pixel pixel-heading text-[16px] tracking-[0.2em] text-fg-dim underline decoration-line underline-offset-8 transition-colors hover:text-pop"
          >
            {social.label}
          </a>
        ))}
      </nav>
    </section>
  );
}

function MotionCard({ card, index }: { card: MotionCardDef; index: number }) {
  const { t } = useLanguage();

  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={cardPop}
      data-motion={card.id}
      className="group flex flex-col border-2 border-fg bg-bg-2 transition-[transform,box-shadow] duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#ffd23f]"
    >
      <header className="flex items-center gap-3 border-b-2 border-fg px-4 py-3">
        <span className="pixel-heading border border-line bg-bg px-2 py-0.5 text-[14px] text-pop">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="pixel-heading text-[19px] tracking-[0.08em]">{t(card.titleKey)}</h3>
      </header>

      <div className="stage-grid relative aspect-square cursor-crosshair overflow-hidden">
        <MotionDemo kind={card.demo} />
        {card.hintKey && (
          <span className="pixel-heading pointer-events-none absolute right-2 top-2 border border-line bg-bg/80 px-2 py-1 text-[10px] tracking-[0.16em] text-fg-dim opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {t(card.hintKey)}
          </span>
        )}
      </div>

      <p className="px-4 py-4 text-[13px] leading-relaxed text-fg-dim">{t(card.descKey)}</p>
    </motion.article>
  );
}
