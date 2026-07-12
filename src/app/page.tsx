import { Hero } from "@/components/sections/Hero";
import { BuySection } from "@/components/sections/BuySection";
import { MotionsSection } from "@/components/sections/MotionsSection";
import { StickyBuyBar } from "@/components/layout/StickyBuyBar";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <BuySection id="buy" />
      <MotionsSection />
      <BuySection bottom />
      <StickyBuyBar />
    </main>
  );
}
