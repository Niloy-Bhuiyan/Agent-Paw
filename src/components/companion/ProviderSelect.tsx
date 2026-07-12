"use client";

import { companionStore, useCompanionStore } from "@/lib/store/companionStore";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProviderId } from "@/lib/ai/types";

/** Provider picker + LIVE/MOCK status badges. Unconfigured entries are disabled. */
export function ProviderSelect() {
  const { t } = useLanguage();
  const providers = useCompanionStore((s) => s.providers);
  const selected = useCompanionStore((s) => s.selectedProvider);

  if (providers.length === 0) {
    return <p className="text-[12px] text-fg-dim">Loading providers…</p>;
  }

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="AI provider">
      {providers.map((provider) => {
        const active = provider.id === selected;
        const live = provider.configured && provider.id !== "mock";
        return (
          <button
            key={provider.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!provider.configured}
            onClick={() =>
              companionStore.set({ selectedProvider: provider.id as ProviderId })
            }
            className={`focus-pixel flex cursor-pointer items-center gap-3 border-2 px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active ? "border-pop bg-pop/10" : "border-line hover:border-fg"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${
                live ? "bg-[#28c840]" : provider.configured ? "bg-pop" : "bg-fg-dim/40"
              }`}
            />
            <span className="flex-1">
              <span className="block text-[13px] text-fg">{provider.label}</span>
              <span className="block font-mono text-[11px] text-fg-dim">{provider.model}</span>
            </span>
            <span
              className={`pixel-heading border px-1.5 py-0.5 text-[10px] tracking-[0.16em] ${
                live ? "border-[#28c840]/60 text-[#28c840]" : "border-line text-fg-dim"
              }`}
            >
              {live ? "LIVE" : provider.configured ? "MOCK" : "NO KEY"}
            </span>
          </button>
        );
      })}
      <p className="mt-1 text-[11px] leading-relaxed text-fg-dim/80">
        {t("companion.provider.note")}
      </p>
    </div>
  );
}
