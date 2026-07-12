import type { CatPalette, CatVariant } from "@/types";

/**
 * Original hand-picked palettes for each fur variant.
 * `patch2` is only used by the calico ("mixed") variant.
 */
export const CAT_PALETTES: Record<CatVariant, CatPalette> = {
  orange: {
    outline: "#181818",
    body: "#f2a24e",
    patch: "#d47f2c",
    belly: "#ffe9c9",
    innerEar: "#ff9db0",
    nose: "#d96a78",
    blush: "#ff8f8f",
  },
  black: {
    outline: "#050505",
    body: "#3a3a40",
    patch: "#28282d",
    belly: "#5a5a63",
    innerEar: "#b76e79",
    nose: "#8f5761",
    blush: "#a06a6a",
  },
  white: {
    outline: "#2b2b2b",
    body: "#f2f2ec",
    patch: "#dedcd2",
    belly: "#ffffff",
    innerEar: "#ffb3c1",
    nose: "#e58a97",
    blush: "#ffa5a5",
  },
  gray: {
    outline: "#161616",
    body: "#9ba1aa",
    patch: "#747a85",
    belly: "#d9dce1",
    innerEar: "#e2a2ae",
    nose: "#b3717d",
    blush: "#d99a9a",
  },
  brown: {
    outline: "#171310",
    body: "#8f5c3c",
    patch: "#6c4227",
    belly: "#dcbb98",
    innerEar: "#e59aa8",
    nose: "#a85f6c",
    blush: "#cf8f8f",
  },
  mixed: {
    outline: "#1c1c1c",
    body: "#f2f2ec",
    patch: "#f2a24e",
    patch2: "#33333a",
    belly: "#ffffff",
    innerEar: "#ffb3c1",
    nose: "#e58a97",
    blush: "#ffa5a5",
  },
};

export const CAT_VARIANTS: readonly CatVariant[] = [
  "orange",
  "black",
  "white",
  "gray",
  "brown",
  "mixed",
];

export const nextVariant = (current: CatVariant): CatVariant => {
  const idx = CAT_VARIANTS.indexOf(current);
  return CAT_VARIANTS[(idx + 1) % CAT_VARIANTS.length] as CatVariant;
};
