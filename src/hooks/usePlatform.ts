"use client";

import { useEffect, useState } from "react";

export type Platform = "macos" | "windows" | "other";

/** Detects the visitor's OS for platform-aware CTAs. */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const raw = String(nav.userAgentData?.platform ?? navigator.platform ?? "").toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    if (raw.includes("win") || ua.includes("windows")) setPlatform("windows");
    else if (raw.includes("mac") || ua.includes("mac os")) setPlatform("macos");
  }, []);

  return platform;
}
