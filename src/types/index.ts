/** Fur variants supported by the pet system. */
export type CatVariant = "orange" | "black" | "white" | "gray" | "brown" | "mixed";

/** High-level behavior modes for the cat animation engine. */
export type CatMode =
  | "sit" // sits, breathes, blinks, tail sway
  | "auto" // random idle: sit, look around, walk, nap
  | "eyes" // sits and tracks the pointer with its eyes
  | "hunt" // chases the pointer around the stage
  | "drag" // externally positioned (mochi drag), stretches while held
  | "knead" // kneads with front paws
  | "overheat" // heats up, turns red, puffs steam
  | "stretch" // periodically grows and stretches
  | "sleep" // curled up, zzz
  | "think" // thinking face with animated dots
  | "celebrate" // happy hop + meow
  | "walk" // walks back and forth
  | "peek"; // peeks in from the stage edge

export type CatEyeStyle = "open" | "happy" | "closed" | "focus";

export interface CatPalette {
  outline: string;
  body: string;
  patch: string;
  patch2?: string;
  belly: string;
  innerEar: string;
  nose: string;
  blush: string;
}

export type Locale = "en" | "ko";
