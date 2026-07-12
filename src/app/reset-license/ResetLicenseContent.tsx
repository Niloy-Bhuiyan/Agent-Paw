"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PixelButton } from "@/components/ui/PixelButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { fadeUp, staggerChildren } from "@/animations/variants";

export function ResetLicenseContent() {
  const { t } = useLanguage();
  const [key, setKey] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) setDone(true);
  };

  return (
    <main className="relative z-10 mx-auto flex min-h-[60vh] max-w-[560px] flex-col justify-center px-5 py-20">
      <motion.div initial="hidden" animate="visible" variants={staggerChildren(0.12)}>
        <motion.h1 variants={fadeUp} className="pixel-heading text-[clamp(30px,4.5vw,44px)]">
          {t("reset.title")}
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-4 text-[14px] text-fg-dim">
          {t("reset.sub")}
        </motion.p>

        <motion.form variants={fadeUp} onSubmit={submit} className="mt-10 flex flex-col gap-5">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder={t("reset.placeholder")}
            aria-label="License key"
            className="focus-pixel border-2 border-fg bg-bg-2 px-4 py-3.5 font-mono text-[15px] tracking-[0.2em] text-fg placeholder:text-fg-dim/50"
          />
          <PixelButton type="submit" className="justify-center">
            {t("reset.cta")}
          </PixelButton>
          {done && (
            <p role="status" className="text-[13px] text-pop">
              {t("reset.done")}
            </p>
          )}
        </motion.form>
      </motion.div>
    </main>
  );
}
