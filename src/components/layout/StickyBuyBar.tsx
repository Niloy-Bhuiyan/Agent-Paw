"use client";

import { useEffect, useState } from "react";
import { CatLogo } from "@/components/ui/CatLogo";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Fixed bottom purchase bar. Appears once the hero is scrolled past,
 * and hides whenever a buy section or the footer is on screen —
 * matching the reference behavior.
 */
export function StickyBuyBar() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const buys = Array.from(document.querySelectorAll<HTMLElement>("[data-buy-section]"));
    const footer = document.querySelector("footer");
    if (!hero) return;

    const update = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      const inBuy = buys.some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight - 56 && rect.bottom > 96;
      });
      const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
      setVisible(heroBottom < 80 && !inBuy && footerTop >= window.innerHeight - 24);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-50 border-t-2 border-fg bg-bg/95 px-4 py-3 backdrop-blur-sm transition-transform duration-300 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] sm:px-8 ${
        visible ? "translate-y-0" : "translate-y-[110%]"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <CatLogo size={22} />
          <span className="pixel-heading hidden text-[18px] tracking-[0.16em] sm:inline">
            AGENTPAW
          </span>
        </span>
        <span className="pixel-heading hidden flex-1 text-center text-[15px] tracking-[0.2em] text-fg-dim md:block">
          {t("sticky.tag")}
        </span>
        <a
          href="#buy"
          tabIndex={visible ? 0 : -1}
          className="focus-pixel pixel-heading flex cursor-pointer items-center gap-2 border-2 border-fg bg-fg px-5 py-2 text-[17px] tracking-[0.14em] text-bg shadow-[3px_3px_0_0_#ffd23f] transition-transform hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none"
        >
          {t("sticky.cta")} <span aria-hidden="true">▸</span>
        </a>
      </div>
    </div>
  );
}
