"use client";

import { motion } from "framer-motion";
import { AgentStatusPanel } from "@/components/companion/AgentStatusPanel";
import { ChatPanel } from "@/components/companion/ChatPanel";
import { CompanionCatStage } from "@/components/companion/CompanionCatStage";
import { ProviderSelect } from "@/components/companion/ProviderSelect";
import { fadeUp, staggerChildren } from "@/animations/variants";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The AI companion workspace: live cat (reacting to everything), the chat
 * conversation, provider controls, and the agent work-status feed.
 */
export function CompanionApp() {
  const { t } = useLanguage();
  return (
    <main className="relative z-10 mx-auto max-w-[1280px] px-5 py-12 sm:px-10">
      <motion.div initial="hidden" animate="visible" variants={staggerChildren(0.1)}>
        <motion.h1
          variants={fadeUp}
          className="pixel-heading text-center text-[clamp(30px,4.4vw,48px)]"
        >
          {t("companion.title")}
        </motion.h1>
        <motion.p variants={fadeUp} className="mx-auto mt-3 max-w-[640px] text-center text-[14px] text-fg-dim">
          {t("companion.sub")}
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-10 grid gap-6 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.6fr)_minmax(260px,1fr)]"
        >
          {/* Left: the cat + provider selection */}
          <div className="flex flex-col gap-6">
            <CompanionCatStage />
            <div className="border-2 border-fg bg-bg-2">
              <h2 className="pixel-heading border-b-2 border-fg px-4 py-2.5 text-[15px] tracking-[0.12em]">
                {t("companion.provider.title")}
              </h2>
              <div className="p-4">
                <ProviderSelect />
              </div>
            </div>
          </div>

          {/* Center: conversation */}
          <div className="min-h-[560px] lg:min-h-[640px]">
            <ChatPanel />
          </div>

          {/* Right: agent work-status feed */}
          <div className="flex flex-col gap-6">
            <AgentStatusPanel />
            <p className="border-2 border-line px-4 py-3 text-[11.5px] leading-relaxed text-fg-dim">
              {t("companion.agents.note")} <code>NEXT_PUBLIC_AGENT_WS_URL</code> ▸{" "}
              <span className="text-fg-dim/70">live feed</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
