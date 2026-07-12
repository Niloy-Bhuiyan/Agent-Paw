"use client";

import { usePathname } from "next/navigation";
import { BackgroundFX } from "@/components/layout/BackgroundFX";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Wraps pages with the site chrome (background FX, header, footer) —
 * except on /desktop, which renders bare for the transparent
 * Electron pet window.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/desktop")) return <>{children}</>;

  return (
    <>
      <BackgroundFX />
      <Header />
      {children}
      <Footer />
    </>
  );
}
