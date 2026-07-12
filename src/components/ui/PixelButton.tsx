"use client";

import type { ComponentProps, ReactNode } from "react";

type Variant = "solid" | "ghost" | "pop";

const base =
  "focus-pixel pixel-heading inline-flex cursor-pointer items-center gap-3 border-2 px-5 py-3.5 text-[19px] tracking-[0.12em] transition-[transform,box-shadow] duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

const variants: Record<Variant, string> = {
  solid:
    "border-fg bg-fg text-bg shadow-[4px_4px_0_0_#0a0a0a,4px_4px_0_1px_#f5f5f5] hover:-translate-x-[1px] hover:-translate-y-[1px]",
  ghost:
    "border-fg bg-transparent text-fg shadow-[4px_4px_0_0_#f5f5f5] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-fg hover:text-bg",
  pop: "border-pop bg-pop text-bg shadow-[4px_4px_0_0_#f5f5f5] hover:-translate-x-[1px] hover:-translate-y-[1px]",
};

interface PixelButtonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function PixelButton({
  variant = "solid",
  className,
  children,
  ...rest
}: PixelButtonProps & ComponentProps<"button">) {
  return (
    <button className={`${base} ${variants[variant]} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}
