import { PawLoader } from "@/components/ui/PawLoader";

/** Route-transition loading screen: bouncing pixel paws, like the reference. */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center gap-4"
    >
      <PawLoader className="scale-150 text-fg" />
      <span className="pixel-heading text-[16px] tracking-[0.24em] text-fg-dim">LOADING...</span>
    </div>
  );
}
