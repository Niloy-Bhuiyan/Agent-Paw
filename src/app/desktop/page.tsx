import type { Metadata } from "next";
import { DesktopPet } from "@/components/pet-companion/DesktopPet";

export const metadata: Metadata = {
  title: "Desktop Pet — AgentPaw",
  description: "The transparent always-on-top desktop pet window.",
  robots: { index: false },
};

export default function DesktopPage() {
  return <DesktopPet />;
}
