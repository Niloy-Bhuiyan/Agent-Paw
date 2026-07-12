"use client";

/**
 * Two tiny original pixel paws that bounce alternately —
 * used in the price block and page loaders.
 */
export function PawLoader({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-1 ${className ?? ""}`} aria-hidden="true">
      <PixelPaw className="animate-paw-bounce" />
      <PixelPaw className="animate-paw-bounce [animation-delay:0.45s]" />
    </span>
  );
}

function PixelPaw({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="18"
      height="18"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="1" y="1" width="2" height="2" />
        <rect x="5" y="0" width="2" height="2" />
        <rect x="9" y="1" width="2" height="2" />
        <rect x="2" y="5" width="8" height="5" />
        <rect x="3" y="4" width="6" height="1" />
        <rect x="3" y="10" width="6" height="1" />
      </g>
    </svg>
  );
}
