/** Original pixel cat-face mark used as the brand logo. */
export function CatLogo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <rect x="1" y="1" width="2" height="3" />
        <rect x="13" y="1" width="2" height="3" />
        <rect x="2" y="3" width="12" height="1" />
        <rect x="1" y="4" width="14" height="8" />
        <rect x="3" y="12" width="10" height="1" />
      </g>
      <g fill="#0a0a0a">
        <rect x="4" y="6" width="2" height="3" />
        <rect x="10" y="6" width="2" height="3" />
        <rect x="7" y="9" width="2" height="1" />
      </g>
    </svg>
  );
}
