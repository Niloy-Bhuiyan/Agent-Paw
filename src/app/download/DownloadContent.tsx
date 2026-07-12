"use client";

import { motion } from "framer-motion";
import { PixelCat } from "@/components/pet/PixelCat";
import { PixelButton } from "@/components/ui/PixelButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatform } from "@/hooks/usePlatform";
import { fadeUp, staggerChildren } from "@/animations/variants";

export function DownloadContent() {
  const { t } = useLanguage();
  const platform = usePlatform();

  return (
    <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-[860px] flex-col items-center px-5 py-20 text-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.12)}
        className="flex w-full flex-col items-center"
      >
        <motion.div
          variants={fadeUp}
          className="stage-grid mb-10 aspect-square w-[240px] border-2 border-fg bg-bg-2"
        >
          <PixelCat mode="auto" variant="orange" scale={0.5} ariaLabel="Comnyang waiting for download" />
        </motion.div>

        <motion.h1 variants={fadeUp} className="pixel-heading text-[clamp(32px,5vw,52px)]">
          {t("download.title")}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-4 max-w-[480px] text-[14px] text-fg-dim">
          {t("download.sub")}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-5">
          <PixelButton variant={platform === "macos" ? "solid" : "ghost"}>
            {t("download.mac")}
          </PixelButton>
          <PixelButton variant={platform === "windows" ? "solid" : "ghost"}>
            {t("download.win")}
          </PixelButton>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-8 text-[12px] text-fg-dim/70">
          {t("download.note")}
        </motion.p>
      </motion.div>
    </main>
  );
}
