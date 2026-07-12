import type { Metadata } from "next";
import { PetStage } from "@/components/pet-companion/PetStage";

export const metadata: Metadata = {
  title: "AI Companion Pet — Comnyang",
  description:
    "A living pixel-cat coding companion that reacts to your development environment and displays useful information through bubbles, signs and floating widgets.",
};

export default function PetPage() {
  return (
    <main>
      <PetStage />
    </main>
  );
}
