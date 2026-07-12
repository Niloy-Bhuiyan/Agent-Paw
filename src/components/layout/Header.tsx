"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CatLogo } from "@/components/ui/CatLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { localeNames } from "@/lib/i18n";
import type { Locale } from "@/types";

export function Header() {
  return (
    <header className="relative z-[100] flex items-center justify-between border-b border-line px-5 py-6 sm:px-10 lg:px-14">
      <Link
        href="/"
        aria-label="Comnyang home"
        className="focus-pixel flex items-center gap-3 text-fg transition-colors hover:text-pop"
      >
        <CatLogo className="text-current" />
        <span className="pixel-heading text-[22px] tracking-[0.18em]">COMNYANG</span>
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
        <NavLinks />
      </nav>

      <MobileMenu />
    </header>
  );
}

function NavLinks() {
  const { t } = useLanguage();
  const linkCls =
    "focus-pixel pixel-heading text-[17px] tracking-[0.16em] text-fg-dim transition-colors hover:text-fg";
  return (
    <>
      <Link href="/pet" className={`${linkCls} text-pop hover:text-pop`}>
        {t("nav.pet")}
      </Link>
      <Link href="/companion" className={linkCls}>
        {t("nav.companion")}
      </Link>
      <Link href="/showcase" className={linkCls}>
        {t("nav.showcase")}
      </Link>
      <Link href="/download" className={linkCls}>
        {t("nav.download")}
      </Link>
      <button type="button" className={`${linkCls} cursor-pointer`}>
        {t("nav.account")}
      </button>
      <LangToggle />
    </>
  );
}

function LangToggle() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((v) => !v)}
        className="focus-pixel flex cursor-pointer items-center gap-2 border border-line px-3 py-1.5 text-[13px] text-fg-dim transition-colors hover:border-fg hover:text-fg"
      >
        {localeNames[locale]}
        <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 min-w-full border border-line bg-bg-2"
          >
            {(Object.keys(localeNames) as Locale[]).map((code) => (
              <button
                key={code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={`focus-pixel block w-full cursor-pointer px-3 py-2 text-left text-[13px] transition-colors hover:bg-line ${
                  code === locale ? "text-pop" : "text-fg-dim"
                }`}
              >
                {localeNames[code]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="More navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-pixel cursor-pointer border border-line px-3 py-1 text-xl text-fg"
      >
        ⋯
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full z-50 flex flex-col gap-5 border-b border-line bg-bg px-6 py-6"
          >
            <NavLinks />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
