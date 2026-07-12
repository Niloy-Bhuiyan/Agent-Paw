import Link from "next/link";
import { PixelCat } from "@/components/pet/PixelCat";

/** Custom 404 — a sleeping cat instead of the framework default. */
export default function NotFound() {
  return (
    <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-[560px] flex-col items-center justify-center px-5 py-16 text-center">
      <div className="stage-grid mb-8 aspect-square w-[200px] border-2 border-fg bg-bg-2">
        <PixelCat mode="sleep" variant="gray" scale={0.55} interactive={false} ariaLabel="Sleeping cat" />
      </div>
      <h1 className="pixel-heading text-[clamp(28px,4.5vw,40px)]">404 — NOTHING HERE</h1>
      <p className="mt-3 text-[14px] text-fg-dim">
        The cat looked everywhere. This page doesn&apos;t exist (or it&apos;s napping under the sofa).
      </p>
      <Link
        href="/"
        className="focus-pixel pixel-heading mt-8 inline-flex items-center gap-3 border-2 border-fg bg-fg px-6 py-3.5 text-[18px] tracking-[0.12em] text-bg shadow-[4px_4px_0_0_#0a0a0a,4px_4px_0_1px_#f5f5f5] transition-transform hover:-translate-y-[1px]"
      >
        BACK HOME ◂
      </Link>
    </main>
  );
}
