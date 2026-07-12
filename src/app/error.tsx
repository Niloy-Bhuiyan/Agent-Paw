"use client";

import { useEffect } from "react";
import { PixelCat } from "@/components/pet/PixelCat";
import { PixelButton } from "@/components/ui/PixelButton";

/** Global error boundary — the cat overheats, the user can recover. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-[560px] flex-col items-center justify-center px-5 py-16 text-center">
      <div className="stage-grid mb-8 aspect-square w-[200px] border-2 border-fg bg-bg-2">
        <PixelCat mode="overheat" variant="orange" scale={0.55} interactive={false} ariaLabel="Overheated cat" />
      </div>
      <h1 className="pixel-heading text-[clamp(28px,4.5vw,40px)]">SOMETHING WENT WRONG</h1>
      <p className="mt-3 text-[14px] text-fg-dim">
        The cat knocked something off the shelf. It&apos;s probably fine — try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-fg-dim/60">ref: {error.digest}</p>
      )}
      <PixelButton className="mt-8" onClick={reset}>
        TRY AGAIN ↻
      </PixelButton>
    </main>
  );
}
