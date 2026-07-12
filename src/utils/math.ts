export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Frame-rate independent exponential smoothing factor. */
export const damp = (from: number, to: number, lambda: number, dt: number): number =>
  lerp(from, to, 1 - Math.exp(-lambda * dt));

export const randRange = (min: number, max: number): number => min + Math.random() * (max - min);

export const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)] as T;
