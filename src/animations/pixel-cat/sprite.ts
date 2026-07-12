import type { CatEyeStyle, CatPalette } from "@/types";
import { clamp } from "@/utils/math";

/**
 * Procedural pixel-cat renderer (original artwork).
 *
 * The cat is drawn on a logical grid of CAT_W x CAT_H cells and scaled by the
 * caller. Poses are parameterised (squash, leg phase, tail angle, pupil
 * offset...) so the engine can animate smoothly without pre-baked frames.
 */

export const CAT_W = 24;
export const CAT_H = 22;

export type CatBodyPose = "sit" | "walk" | "loaf" | "stretch" | "pounce";

export interface CatRenderState {
  bodyPose: CatBodyPose;
  facing: 1 | -1;
  /** 0..1 breathing / squash amount (1 = fully squashed). */
  squash: number;
  /** Pupil offset in cells, roughly -1.5..1.5 */
  lookX: number;
  lookY: number;
  /** 0 = open, 1 = fully closed. */
  blink: number;
  eyeStyle: CatEyeStyle;
  /** Radians-ish sway for the tail, -1..1. */
  tailSway: number;
  /** 0..1 walk cycle phase. */
  legPhase: number;
  /** 0..1 knead cycle (paws alternate). */
  kneadPhase: number;
  /** Whether kneading paws are active. */
  kneading: boolean;
  /** 0..1 red-heat blend. */
  heat: number;
  /** Extra vertical stretch for mochi-drag, 0..1. */
  mochi: number;
}

export const defaultRenderState = (): CatRenderState => ({
  bodyPose: "sit",
  facing: 1,
  squash: 0,
  lookX: 0,
  lookY: 0,
  blink: 0,
  eyeStyle: "open",
  tailSway: 0,
  legPhase: 0,
  kneadPhase: 0,
  kneading: false,
  heat: 0,
  mochi: 0,
});

const mixColor = (hex: string, target: string, t: number): string => {
  if (t <= 0.01) return hex;
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const a = parse(hex);
  const b = parse(target);
  const c = a.map((v, i) => Math.round(v + ((b[i] as number) - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

interface Ctx2D {
  ctx: CanvasRenderingContext2D;
  cell: number;
  palette: CatPalette;
  heat: number;
}

const px = (d: Ctx2D, x: number, y: number, w: number, h: number, color: string) => {
  d.ctx.fillStyle = color;
  d.ctx.fillRect(Math.round(x * d.cell), Math.round(y * d.cell), w * d.cell, h * d.cell);
};

const body = (d: Ctx2D) => mixColor(d.palette.body, "#e2574c", d.heat * 0.75);
const patch = (d: Ctx2D) => mixColor(d.palette.patch, "#c74438", d.heat * 0.7);
const belly = (d: Ctx2D) => mixColor(d.palette.belly, "#f0897f", d.heat * 0.55);

/** Rounded pixel rect: fills a rect but drops the 4 corner cells. */
const roundRect = (d: Ctx2D, x: number, y: number, w: number, h: number, color: string) => {
  px(d, x + 1, y, w - 2, h, color);
  px(d, x, y + 1, w, h - 2, color);
};

const outlineRoundRect = (d: Ctx2D, x: number, y: number, w: number, h: number) => {
  const o = d.palette.outline;
  px(d, x + 1, y - 1, w - 2, 1, o);
  px(d, x + 1, y + h, w - 2, 1, o);
  px(d, x - 1, y + 1, 1, h - 2, o);
  px(d, x + w, y + 1, 1, h - 2, o);
  px(d, x, y, 1, 1, o);
  px(d, x + w - 1, y, 1, 1, o);
  px(d, x, y + h - 1, 1, 1, o);
  px(d, x + w - 1, y + h - 1, 1, 1, o);
};

const drawEyes = (
  d: Ctx2D,
  s: CatRenderState,
  leftX: number,
  rightX: number,
  y: number,
) => {
  const { palette } = d;
  const lookX = clamp(s.lookX, -1.5, 1.5);
  const lookY = clamp(s.lookY, -1, 1);

  if (s.eyeStyle === "happy") {
    // ^ ^ shaped happy eyes
    for (const ex of [leftX, rightX]) {
      px(d, ex, y + 0.5, 0.5, 0.5, palette.outline);
      px(d, ex + 0.5, y, 0.5, 0.5, palette.outline);
      px(d, ex + 1, y + 0.5, 0.5, 0.5, palette.outline);
    }
    return;
  }

  if (s.eyeStyle === "closed" || s.blink > 0.6) {
    for (const ex of [leftX, rightX]) px(d, ex, y + 0.75, 1.5, 0.4, palette.outline);
    return;
  }

  const pw = 0.75; // pupil size
  for (const ex of [leftX, rightX]) {
    px(d, ex, y, 1.5, 1.5, "#ffffff");
    const pxx = ex + 0.4 + lookX * 0.35;
    const pyy = y + 0.4 + lookY * 0.35;
    px(d, pxx, pyy, pw, pw, "#101010");
    if (s.eyeStyle === "focus") px(d, ex, y, 1.5, 0.45, d.palette.outline);
  }
};

const drawMuzzle = (d: Ctx2D, s: CatRenderState, cx: number, y: number) => {
  px(d, cx - 0.5, y, 1, 0.6, d.palette.nose);
  px(d, cx - 0.25, y + 0.6, 0.5, 0.5, d.palette.outline);
  if (s.eyeStyle === "happy") {
    px(d, cx - 1.1, y + 1, 0.7, 0.4, d.palette.outline);
    px(d, cx + 0.4, y + 1, 0.7, 0.4, d.palette.outline);
  }
};

const drawTail = (d: Ctx2D, s: CatRenderState, baseX: number, baseY: number) => {
  const dir = s.facing;
  const sway = s.tailSway;
  const c = patch(d);
  // Tail rises behind the body in a pixel arc; sway bends the tip.
  const segs: Array<[number, number]> = [
    [0, 0],
    [1, -0.6],
    [1.8, -1.5],
    [2.3, -2.6],
    [2.4 + sway * 0.7, -3.8],
    [2.2 + sway * 1.4, -5.0],
  ];
  segs.forEach(([sx, sy], i) => {
    const w = i >= 4 ? 1.2 : 1;
    px(d, baseX + dir * sx - (dir < 0 ? w : 0), baseY + sy, w, 1.2, i === segs.length - 1 ? body(d) : c);
  });
};

/** Front-facing sitting cat (default pose). */
const drawSitting = (d: Ctx2D, s: CatRenderState) => {
  const squashY = s.squash * 1.2 - s.mochi * 3.5; // mochi stretches upward
  const top = 2 + squashY;
  const headX = 6;
  const headW = 12;
  const headH = 8 - s.squash * 0.6;
  const bodyTop = top + headH - 0.5;
  const bodyH = CAT_H - 3 - bodyTop + s.mochi * 3.5;

  drawTail(d, s, s.facing > 0 ? 19.5 : 4.5, CAT_H - 5);

  // Body (slightly narrower than head bottom, widens to base)
  outlineRoundRect(d, 7, bodyTop, 10, bodyH);
  roundRect(d, 7, bodyTop, 10, bodyH, body(d));
  px(d, 9, bodyTop + bodyH - 4.5, 6, 3.4, belly(d));

  // Ears
  const earLift = s.squash * 0.4;
  for (const [ex, inner] of [
    [headX + 0.5, headX + 1.6],
    [headX + headW - 3.5, headX + headW - 2.6],
  ] as const) {
    px(d, ex, top - 2 + earLift, 3, 2.4, d.palette.outline);
    px(d, ex + 0.5, top - 1.4 + earLift, 2, 1.8, body(d));
    px(d, inner, top - 0.9 + earLift, 1, 1, d.palette.innerEar);
  }

  // Head
  outlineRoundRect(d, headX, top, headW, headH);
  roundRect(d, headX, top, headW, headH, body(d));

  // Fur patches (variant markings)
  px(d, headX + headW - 4, top + 0.5, 3.5, 2.2, patch(d));
  if (d.palette.patch2) {
    px(d, headX + 0.5, top + 0.5, 3, 2, mixColor(d.palette.patch2, "#c74438", d.heat * 0.7));
    px(d, 8, bodyTop + 2, 3, 2.6, mixColor(d.palette.patch2, "#c74438", d.heat * 0.7));
  }
  px(d, 13.4, bodyTop + 1.6, 3, 2.6, patch(d));

  // Face
  const eyeY = top + 3.4 + s.lookY * 0.2;
  drawEyes(d, s, headX + 2.2, headX + headW - 3.7, eyeY);
  drawMuzzle(d, s, headX + headW / 2, top + 5.4);

  // Blush when happy
  if (s.eyeStyle === "happy") {
    px(d, headX + 1.2, eyeY + 1.8, 1.4, 0.7, d.palette.blush);
    px(d, headX + headW - 2.6, eyeY + 1.8, 1.4, 0.7, d.palette.blush);
  }

  // Whiskers
  px(d, headX - 1.4, top + 4.6, 1.6, 0.35, d.palette.outline);
  px(d, headX + headW - 0.2, top + 4.6, 1.6, 0.35, d.palette.outline);

  // Front paws — knead animation lifts them alternately
  const paws: Array<[number, number]> = [
    [8.5, s.kneading ? -Math.max(0, Math.sin(s.kneadPhase * Math.PI * 2)) * 1.6 : 0],
    [12.5, s.kneading ? -Math.max(0, Math.sin((s.kneadPhase + 0.5) * Math.PI * 2)) * 1.6 : 0],
  ];
  for (const [pxx, lift] of paws) {
    px(d, pxx, CAT_H - 3.6 + lift, 3, 1.6, body(d));
    px(d, pxx, CAT_H - 2.2 + lift, 3, 0.5, d.palette.outline);
    px(d, pxx + 0.9, CAT_H - 3 + lift, 0.4, 0.8, d.palette.outline);
    px(d, pxx + 1.8, CAT_H - 3 + lift, 0.4, 0.8, d.palette.outline);
  }
};

/** Side-view walking cat. */
const drawWalking = (d: Ctx2D, s: CatRenderState) => {
  const dir = s.facing;
  const bob = Math.sin(s.legPhase * Math.PI * 2) * 0.5;
  const bodyY = 9 + bob * 0.4;
  const flip = (x: number, w: number) => (dir > 0 ? x : CAT_W - x - w);

  drawTail(d, s, dir > 0 ? 3.5 : 20.5, bodyY + 4);

  // Body
  outlineRoundRect(d, flip(4, 13), bodyY, 13, 7);
  roundRect(d, flip(4, 13), bodyY, 13, 7, body(d));
  px(d, flip(6, 7), bodyY + 4.6, 7, 2, belly(d));
  px(d, flip(6, 4), bodyY + 0.6, 4, 2.4, patch(d));

  // Legs (4, alternating pairs)
  for (let i = 0; i < 4; i++) {
    const phase = s.legPhase * Math.PI * 2 + (i % 2 === 0 ? 0 : Math.PI);
    const lift = Math.max(0, Math.sin(phase)) * 1.4;
    const legX = flip(5.4 + i * 3.1, 1.8);
    px(d, legX, bodyY + 6.4 - lift, 1.8, 4 + lift * 0.4, body(d));
    px(d, legX, bodyY + 10 - lift, 1.8, 0.5, d.palette.outline);
  }

  // Head
  const headX = flip(13.4, 9);
  const headY = bodyY - 5.4 + bob;
  for (const ex of [headX + 0.6, headX + 9 - 3.6]) {
    px(d, ex, headY - 1.8, 3, 2.2, d.palette.outline);
    px(d, ex + 0.5, headY - 1.2, 2, 1.6, body(d));
  }
  outlineRoundRect(d, headX, headY, 9, 7.4);
  roundRect(d, headX, headY, 9, 7.4, body(d));
  px(d, dir > 0 ? headX + 5.4 : headX + 0.6, headY + 0.4, 3, 2, patch(d));

  const eyeY = headY + 2.8;
  if (dir > 0) drawEyes(d, s, headX + 2, headX + 5.6, eyeY);
  else drawEyes(d, s, headX + 1.2, headX + 4.8, eyeY);
  drawMuzzle(d, s, headX + 4.5 + dir * 1.2, headY + 5);
};

/** Curled sleeping loaf. */
const drawLoaf = (d: Ctx2D, s: CatRenderState) => {
  const top = 9;
  drawTail(d, s, s.facing > 0 ? 19 : 5, CAT_H - 4);
  outlineRoundRect(d, 4, top + 4, 16, 7);
  roundRect(d, 4, top + 4, 16, 7, body(d));
  px(d, 6, top + 5, 4, 2.4, patch(d));
  px(d, 14, top + 7, 4, 2.6, patch(d));

  // Head resting on paws
  const headX = 7;
  for (const ex of [headX + 0.5, headX + 10 - 3.5]) {
    px(d, ex, top - 1.6, 3, 2, d.palette.outline);
    px(d, ex + 0.5, top - 1, 2, 1.4, body(d));
  }
  outlineRoundRect(d, headX, top, 10, 6.4);
  roundRect(d, headX, top, 10, 6.4, body(d));
  drawEyes(d, { ...s, eyeStyle: "closed" }, headX + 1.8, headX + 6.4, top + 2.6);
  drawMuzzle(d, s, headX + 5, top + 4.2);
};

/** Big stretch — arms up, body elongated. */
const drawStretch = (d: Ctx2D, s: CatRenderState) => {
  const top = 1;
  drawTail(d, s, s.facing > 0 ? 18.5 : 5.5, CAT_H - 5);

  // Long body
  outlineRoundRect(d, 8, top + 8, 8, CAT_H - 11);
  roundRect(d, 8, top + 8, 8, CAT_H - 11, body(d));
  px(d, 9.5, top + 12, 5, 4, belly(d));

  // Arms stretched up
  for (const ax of [6.4, 15.6]) {
    px(d, ax, top + 3, 2, 7, body(d));
    px(d, ax, top + 2.4, 2, 0.6, d.palette.outline);
  }

  // Ears + head
  const headX = 7;
  for (const [ex, inner] of [
    [headX + 0.5, headX + 1.5],
    [headX + 10 - 3.5, headX + 10 - 2.5],
  ] as const) {
    px(d, ex, top - 1.2, 3, 2, d.palette.outline);
    px(d, ex + 0.5, top - 0.6, 2, 1.4, body(d));
    px(d, inner, top - 0.2, 1, 0.8, d.palette.innerEar);
  }
  outlineRoundRect(d, headX, top + 1, 10, 7);
  roundRect(d, headX, top + 1, 10, 7, body(d));
  px(d, headX + 6, top + 1.4, 3.4, 2, patch(d));
  drawEyes(d, { ...s, eyeStyle: s.eyeStyle === "open" ? "closed" : s.eyeStyle }, headX + 1.8, headX + 6.6, top + 3.8);
  drawMuzzle(d, s, headX + 5, top + 5.8);
};

/** Pounce crouch (hunting) — low body, butt up. */
const drawPounce = (d: Ctx2D, s: CatRenderState) => {
  const dir = s.facing;
  const flip = (x: number, w: number) => (dir > 0 ? x : CAT_W - x - w);
  const wig = Math.sin(s.legPhase * Math.PI * 4) * 0.6;

  drawTail(d, { ...s, tailSway: s.tailSway + wig * 0.6 }, dir > 0 ? 4 : 20, 12);

  // Raised rear
  outlineRoundRect(d, flip(4, 9), 10 + wig * 0.3, 9, 8);
  roundRect(d, flip(4, 9), 10 + wig * 0.3, 9, 8, body(d));
  px(d, flip(5, 4), 11, 4, 2.4, patch(d));

  // Lowered front + head
  outlineRoundRect(d, flip(11, 9), 13.4, 9, 5);
  roundRect(d, flip(11, 9), 13.4, 9, 5, body(d));

  const headX = flip(13.5, 9.4);
  const headY = 8.4;
  for (const ex of [headX + 0.5, headX + 9.4 - 3.5]) {
    px(d, ex, headY - 1.6, 3, 2, d.palette.outline);
    px(d, ex + 0.5, headY - 1, 2, 1.4, body(d));
  }
  outlineRoundRect(d, headX, headY, 9.4, 7);
  roundRect(d, headX, headY, 9.4, 7, body(d));
  drawEyes(d, { ...s, eyeStyle: "focus" }, headX + 1.6, headX + 5.8, headY + 2.6);
  drawMuzzle(d, s, headX + 4.7 + dir, headY + 4.8);

  // Front paws ready
  px(d, flip(12, 2), 17.6, 2, 1.4, body(d));
  px(d, flip(16.4, 2), 17.6, 2, 1.4, body(d));
};

export interface DrawCatOptions {
  ctx: CanvasRenderingContext2D;
  /** Size of one logical cell in device pixels. */
  cell: number;
  palette: CatPalette;
  state: CatRenderState;
}

/** Draws the cat into a (CAT_W*cell) x (CAT_H*cell) area at the current origin. */
export const drawCat = ({ ctx, cell, palette, state }: DrawCatOptions): void => {
  const d: Ctx2D = { ctx, cell, palette, heat: state.heat };
  switch (state.bodyPose) {
    case "walk":
      drawWalking(d, state);
      break;
    case "loaf":
      drawLoaf(d, state);
      break;
    case "stretch":
      drawStretch(d, state);
      break;
    case "pounce":
      drawPounce(d, state);
      break;
    default:
      drawSitting(d, state);
  }
};
