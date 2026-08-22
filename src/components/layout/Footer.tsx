"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { site } from "@/lib/config";
import type { MessageKey } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative z-10 border-t border-line px-5 py-10 sm:px-10 lg:px-14">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="pixel-heading text-[20px] tracking-[0.18em]">AGENTPAW</p>
          <p className="mt-1 text-[13px] text-fg-dim">© {new Date().getFullYear()} AgentPaw</p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] tracking-[0.14em]"
        >
          {site.legal.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="focus-pixel text-fg-dim transition-colors hover:text-fg"
            >
              {t(item.key as MessageKey)}
            </a>
          ))}
          <a href="/reset-license" className="focus-pixel text-fg-dim transition-colors hover:text-fg">
            {t("footer.reset")}
          </a>
          <button
            type="button"
            onClick={scrollTop}
            className="focus-pixel cursor-pointer text-fg-dim transition-colors hover:text-fg"
          >
            {t("footer.top")}
          </button>
        </nav>
      </div>
    </footer>
  );
}
