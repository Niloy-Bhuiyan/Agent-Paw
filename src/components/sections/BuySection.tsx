"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PawLoader } from "@/components/ui/PawLoader";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice, site } from "@/lib/config";
import { fadeUp } from "@/animations/variants";

const CORNERS = [
  "left-[-6px] top-[-6px]",
  "right-[-6px] top-[-6px]",
  "bottom-[-6px] left-[-6px]",
  "bottom-[-6px] right-[-6px]",
] as const;

const INCLUDES = [
  "buy.includes.1",
  "buy.includes.2",
  "buy.includes.3",
  "buy.includes.4",
  "buy.includes.5",
] as const;

export function BuySection({ id, bottom = false }: { id?: string; bottom?: boolean }) {
  const { t } = useLanguage();
  const [coffee, setCoffee] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const total = site.basePrice + (coffee ? site.coffeePrice : 0);

  const checkout = () => {
    if (checkingOut) return;
    setCheckingOut(true);
    // Demo recreation: simulate the checkout hand-off, then explain.
    window.setTimeout(() => {
      setCheckingOut(false);
      window.alert(t("checkout.demo"));
    }, 1200);
  };

  return (
    <section
      id={id}
      data-buy-section
      aria-label="Buy AgentPaw"
      className={`relative z-10 flex justify-center px-5 sm:px-10 ${bottom ? "py-24" : "py-16"}`}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={fadeUp}
        className="relative grid w-full max-w-[1120px] items-center gap-10 border-[3px] border-fg bg-fg p-8 text-bg shadow-[8px_8px_0_0_#111111,8px_8px_0_3px_#f5f5f5] sm:p-12 lg:grid-cols-[1fr_0.82fr] lg:gap-16"
      >
        {CORNERS.map((pos) => (
          <span key={pos} aria-hidden="true" className={`absolute size-3 bg-pop ${pos}`} />
        ))}

        <div>
          <h2 className="pixel-heading text-[clamp(30px,4vw,48px)] leading-[1.15]">
            {t("buy.title.1")}
            <br />
            {t("buy.title.2")}
          </h2>
          <p className="mt-5 max-w-[480px] text-[14px] leading-relaxed text-bg/70">
            {t("buy.note")}
          </p>

          <ul className="mt-7 space-y-2.5 text-[14px] font-medium">
            {INCLUDES.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>

          <Link
            href="/download"
            className="focus-pixel mt-7 inline-block text-[13px] underline underline-offset-4 transition-colors hover:text-bg/60"
          >
            {t("buy.download.link")}
          </Link>
        </div>

        <div className="flex flex-col">
          <div className="border-[3px] border-bg">
            {/* Price block */}
            <div className="pixel-heading relative flex items-baseline justify-end gap-1 border-b-2 border-bg px-6 py-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bg">
                <PawLoader />
              </span>
              <span className="text-[26px]">{t("buy.price.currency")}</span>
              <span className="text-[64px] leading-none">{t("buy.price.amount")}</span>
              <span className="text-[30px]">{t("buy.price.decimal")}</span>
              <span className="animate-tag-wobble ml-3 inline-block bg-pop px-2 py-1 text-[13px] tracking-[0.16em]">
                {t("buy.price.tag")}
              </span>
            </div>

            {/* Support the developer */}
            <div className="px-6 py-5">
              <h3 className="pixel-heading text-[18px] tracking-[0.1em]">{t("support.title")}</h3>
              <p className="mt-1 text-[12.5px] text-bg/60">{t("support.note")}</p>
              <fieldset aria-label="Support options" className="mt-4">
                <label className="flex cursor-pointer items-center gap-3 border-2 border-bg/15 px-4 py-3 text-[13.5px] transition-colors has-checked:border-bg has-checked:bg-pop/25 hover:border-bg/50">
                  <input
                    type="checkbox"
                    checked={coffee}
                    onChange={(e) => setCoffee(e.target.checked)}
                    className="focus-pixel size-4 accent-bg"
                  />
                  <span className="flex-1">{t("support.option.coffee")}</span>
                  <strong>+{formatPrice(site.coffeePrice)}</strong>
                </label>
              </fieldset>
            </div>
          </div>

          <div className="pixel-heading mt-4 flex items-center justify-between px-1 text-[15px] tracking-[0.12em]">
            <span>{t("support.total")}</span>
            <strong className="text-[22px]">{formatPrice(total)}</strong>
          </div>

          <button
            type="button"
            onClick={checkout}
            disabled={checkingOut}
            className="animate-buy-pulse focus-pixel mt-4 flex w-full cursor-pointer flex-col items-center gap-1.5 border-[3px] border-bg bg-bg px-8 py-6 text-fg transition-transform duration-150 hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-wait"
          >
            {checkingOut ? (
              <span className="flex items-center gap-3">
                <PawLoader className="text-fg" />
                <span className="pixel-heading text-[20px] tracking-[0.14em]">
                  {t("checkout.loading")}
                </span>
              </span>
            ) : (
              <>
                <span className="pixel-heading text-[24px] tracking-[0.14em]">
                  {t("buy.cta.main")}
                </span>
                <span className="text-[12px] text-fg-dim">{t("buy.cta.sub")}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
