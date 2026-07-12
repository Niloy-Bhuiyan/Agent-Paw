import type { Metadata } from "next";
import { CompanionApp } from "@/components/companion/CompanionApp";

export const metadata: Metadata = {
  title: "AI Companion — Comnyang",
  description:
    "Chat with the Comnyang pixel cat and watch it react to your AI coding agents' work status.",
};

export default function CompanionPage() {
  return <CompanionApp />;
}
