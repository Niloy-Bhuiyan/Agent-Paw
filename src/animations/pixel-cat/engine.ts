import { CAT_H, CAT_W, defaultRenderState, drawCat, type CatRenderState } from "./sprite";
import { CAT_PALETTES } from "./palettes";
import type { CatMode, CatVariant } from "@/types";
import { clamp, damp, pick, randRange } from "@/utils/math";

/**
 * Pixel-cat behavior engine.
 *
 * Owns a rAF loop, a small behavior state machine, particle overlays
 * (hearts / zzz / steam / thinking dots / music notes) and renders through
 * the procedural sprite renderer. One engine drives one canvas.
 */

type Particle = {
  kind: "heart" | "zzz" | "steam" | "note" | "sparkle";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

type IdlePlan = "sit" | "look" | "walk" | "nap" | "groom";

export interface CatEngineOptions {
  variant?: CatVariant;
  mode?: CatMode;
  /** Cat height as a fraction of stage height (default 0.52). */
  scale?: number;
  reducedMotion?: boolean;
  onMeow?: () => void;
}

export class CatEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private running = false;

  private stageW = 0;
  private stageH = 0;
  private dpr = 1;

  variant: CatVariant;
  mode: CatMode;
  private scaleOpt: number;
  private reducedMotion: boolean;
  private onMeow?: () => void;

  private render: CatRenderState = defaultRenderState();
  private particles: Particle[] = [];

  /** Cat center position in stage px. */
  private x = 0;
  private y = 0;
  private vx = 0;
  private jumpV = 0;
  private jumpY = 0;

  /** Pointer target in stage px (or null). */
  private target: { x: number; y: number } | null = null;
  private pointerInside = false;
  private petting = 0;
  private heat = 0;
  private kneadUntil = 0;
  private stretchUntil = 0;
  private time = 0;

  private blinkAt = 2;
  private idlePlan: IdlePlan = "sit";
  private idleUntil = 0;
  private walkTargetX = 0;
  private peekPhase = 0;

  /** External drag control (mochi). */
  private dragging = false;
  private dragX = 0;
  private dragY = 0;
  private prevDragX = 0;
  private wobble = 0;

  constructor(canvas: HTMLCanvasElement, opts: CatEngineOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.variant = opts.variant ?? "orange";
    this.mode = opts.mode ?? "sit";
    this.scaleOpt = opts.scale ?? 0.52;
    this.reducedMotion = opts.reducedMotion ?? false;
    this.onMeow = opts.onMeow;
    this.resize();
  }

  /* ---------------- public API ---------------- */

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    const first = this.stageW === 0;
    this.stageW = rect.width;
    this.stageH = rect.height;
    if (first) {
      this.x = this.stageW / 2;
      this.y = this.stageH; // ground anchor: cat feet on stage bottom area
      this.walkTargetX = this.x;
    }
    this.x = clamp(this.x, 0, this.stageW);
  }

  setVariant(variant: CatVariant): void {
    this.variant = variant;
    this.burst("sparkle", 6);
  }

  setMode(mode: CatMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.idleUntil = 0;
    this.peekPhase = 0;
  }

  /** Pointer position in stage coordinates (or null when it leaves). */
  setPointer(p: { x: number; y: number } | null): void {
    this.target = p;
    this.pointerInside = p !== null;
  }

  /** Called on pointer move over the head area — builds up purring. */
  pet(): void {
    this.petting = Math.min(1.6, this.petting + 0.16);
  }

  /** A keystroke / interaction that triggers kneading and heat. */
  tap(intensity = 1): void {
    this.kneadUntil = this.time + 0.9;
    if (this.mode === "overheat") this.heat = clamp(this.heat + 0.12 * intensity, 0, 1.35);
  }

  jump(): void {
    if (this.jumpY === 0) {
      this.jumpV = -Math.max(160, this.stageH * 1.15);
      this.meow();
    }
  }

  stretch(duration = 1.8): void {
    this.stretchUntil = this.time + duration;
  }

  startDrag(x: number, y: number): void {
    this.dragging = true;
    this.dragX = this.prevDragX = x;
    this.dragY = y;
  }

  moveDrag(x: number, y: number): void {
    if (!this.dragging) return;
    this.wobble = clamp(this.wobble + Math.abs(x - this.dragX) * 0.02, 0, 3);
    this.prevDragX = this.dragX;
    this.dragX = x;
    this.dragY = y;
  }

  endDrag(): void {
    this.dragging = false;
  }

  meow(): void {
    this.burst("note", 3);
    this.onMeow?.();
  }

  /** Public particle hook for higher-level systems (emotion FSM, reactions). */
  emitParticles(kind: "heart" | "zzz" | "steam" | "note" | "sparkle", count = 3): void {
    this.burst(kind, count);
  }

  /** Live-adjust the cat's size (settings slider). */
  setScale(scale: number): void {
    this.scaleOpt = clamp(scale, 0.2, 0.9);
  }

  /** Cat anchor position in stage pixels (x = center, y = ground line). */
  getPosition(): { x: number; y: number; height: number } {
    return { x: this.x, y: this.y, height: this.catHeightPx() };
  }

  /* ---------------- internals ---------------- */

  private catHeightPx(): number {
    return this.stageH * this.scaleOpt;
  }

  private cell(): number {
    return this.catHeightPx() / CAT_H;
  }

  private burst(kind: Particle["kind"], count: number): void {
    const cell = this.cell();
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind,
        x: this.x + randRange(-4, 4) * cell,
        y: this.y - this.catHeightPx() + randRange(-2, 2) * cell,
        vx: randRange(-14, 14),
        vy: randRange(-46, -22),
        life: 0,
        maxLife: randRange(0.9, 1.6),
        size: randRange(0.8, 1.4),
      });
    }
  }

  private planIdle(): void {
    this.idlePlan = pick<IdlePlan>(["sit", "look", "walk", "sit", "walk", "nap", "groom"]);
    this.idleUntil = this.time + randRange(1.8, 4.2);
    if (this.idlePlan === "walk") {
      const margin = this.catHeightPx() * 0.45;
      this.walkTargetX = randRange(margin, this.stageW - margin);
    }
    if (this.idlePlan === "nap") this.idleUntil = this.time + randRange(3.5, 6);
    if (this.idlePlan === "look") {
      this.render.lookX = randRange(-1.4, 1.4);
      this.render.lookY = randRange(-0.6, 0.8);
    }
  }

  private update(dt: number): void {
    this.time += dt;
    const r = this.render;
    const cell = this.cell();
    const speedBase = this.reducedMotion ? 0 : 1;

    // Breathing + blinking (all modes)
    r.squash = (Math.sin(this.time * 2.2) * 0.5 + 0.5) * 0.5;
    if (this.time > this.blinkAt) {
      r.blink = 1;
      if (this.time > this.blinkAt + 0.14) {
        r.blink = 0;
        this.blinkAt = this.time + randRange(1.6, 4.5);
      }
    }
    r.tailSway = Math.sin(this.time * 1.7) * (this.pointerInside ? 0.9 : 0.55);
    r.kneadPhase = (this.time * 2.6) % 1;

    // Petting decay → happy face + hearts
    this.petting = Math.max(0, this.petting - dt * 0.7);
    const purring = this.petting > 0.35;
    if (purring && Math.random() < dt * 6) this.burst("heart", 1);

    // Heat decay
    if (this.mode === "overheat") {
      this.heat = Math.max(0, this.heat - dt * 0.22);
      if (this.heat > 0.75 && Math.random() < dt * 10) this.burst("steam", 1);
    } else this.heat = 0;
    r.heat = clamp(this.heat, 0, 1);

    r.kneading = this.time < this.kneadUntil || this.mode === "knead";
    if (this.mode === "knead" && Math.random() < dt * 1.2) this.burst("sparkle", 1);

    // Default face
    r.eyeStyle = purring ? "happy" : "open";
    r.mochi = 0;

    // Jump physics
    if (this.jumpY !== 0 || this.jumpV !== 0) {
      this.jumpV += this.stageH * 3.6 * dt;
      this.jumpY += this.jumpV * dt;
      if (this.jumpY >= 0) {
        this.jumpY = 0;
        this.jumpV = 0;
      }
    }

    const mode = this.dragging ? "drag" : this.mode;

    switch (mode) {
      case "sit":
      case "eyes": {
        r.bodyPose = "sit";
        this.lookAtTarget(cell);
        break;
      }

      case "auto": {
        if (this.time > this.idleUntil) this.planIdle();
        if (this.idlePlan === "walk" && speedBase > 0) {
          const dx = this.walkTargetX - this.x;
          if (Math.abs(dx) > cell) {
            r.bodyPose = "walk";
            r.facing = dx > 0 ? 1 : -1;
            this.x += Math.sign(dx) * Math.min(Math.abs(dx), cell * 7 * dt * 2.2);
            r.legPhase = (this.time * 2.4) % 1;
          } else {
            r.bodyPose = "sit";
          }
        } else if (this.idlePlan === "nap") {
          r.bodyPose = "loaf";
          r.eyeStyle = "closed";
          if (Math.random() < dt * 1.4) this.burst("zzz", 1);
        } else {
          r.bodyPose = "sit";
          if (this.idlePlan !== "look") this.lookAtTarget(cell);
        }
        break;
      }

      case "hunt": {
        if (this.target && speedBase > 0) {
          const dx = this.target.x - this.x;
          const dist = Math.abs(dx);
          if (dist > cell * 3) {
            r.bodyPose = "walk";
            r.facing = dx > 0 ? 1 : -1;
            const speed = clamp(dist * 3, cell * 6, cell * 26);
            this.x += Math.sign(dx) * speed * dt;
            r.legPhase = (this.time * 4.2) % 1;
          } else {
            r.bodyPose = "pounce";
            r.facing = dx >= 0 ? 1 : -1;
            r.legPhase = (this.time * 2) % 1;
            if (Math.random() < dt * 0.8) this.jump();
          }
          this.lookAtTarget(cell);
        } else {
          r.bodyPose = "sit";
          this.lookAtTarget(cell);
        }
        break;
      }

      case "drag": {
        r.bodyPose = "sit";
        this.wobble = Math.max(0, this.wobble - dt * 2.4);
        const targetX = this.dragging ? this.dragX : this.stageW / 2;
        const targetY = this.dragging ? this.dragY + this.catHeightPx() * 0.35 : this.stageH;
        this.x = damp(this.x, targetX, 14, dt);
        this.y = damp(this.y, targetY, 14, dt);
        r.mochi = this.dragging ? clamp((this.stageH - this.dragY) / this.stageH, 0.15, 0.8) : 0;
        r.tailSway = Math.sin(this.time * 8) * this.wobble * 0.5 + r.tailSway;
        r.eyeStyle = this.dragging ? "focus" : r.eyeStyle;
        break;
      }

      case "knead": {
        r.bodyPose = "sit";
        r.kneading = true;
        this.lookAtTarget(cell);
        break;
      }

      case "overheat": {
        r.bodyPose = "sit";
        r.kneading = this.time < this.kneadUntil;
        if (this.heat > 0.6) r.eyeStyle = "focus";
        break;
      }

      case "stretch": {
        if (this.time < this.stretchUntil) {
          r.bodyPose = "stretch";
        } else {
          r.bodyPose = "sit";
          this.lookAtTarget(cell);
        }
        break;
      }

      case "sleep": {
        r.bodyPose = "loaf";
        r.eyeStyle = "closed";
        if (Math.random() < dt * 1.2) this.burst("zzz", 1);
        break;
      }

      case "think": {
        r.bodyPose = "sit";
        r.eyeStyle = "focus";
        r.lookX = damp(r.lookX, Math.sin(this.time * 0.9) * 1.2, 4, dt);
        r.lookY = -0.6;
        break;
      }

      case "celebrate": {
        r.bodyPose = "sit";
        r.eyeStyle = "happy";
        if (this.jumpY === 0 && Math.random() < dt * 1.1) this.jump();
        break;
      }

      case "walk": {
        r.bodyPose = "walk";
        r.legPhase = (this.time * 2.6) % 1;
        if (speedBase > 0) {
          this.x += r.facing * cell * 6.5 * dt;
          const margin = this.catHeightPx() * 0.4;
          if (this.x > this.stageW - margin) r.facing = -1;
          if (this.x < margin) r.facing = 1;
        }
        break;
      }

      case "peek": {
        r.bodyPose = "sit";
        this.peekPhase += dt;
        const cycle = this.peekPhase % 6;
        // slide in from the right edge, wait, slide back
        const inX = this.stageW - this.catHeightPx() * 0.34;
        const outX = this.stageW + this.catHeightPx() * 0.7;
        let t: number;
        if (cycle < 1.2) t = cycle / 1.2;
        else if (cycle < 4) t = 1;
        else if (cycle < 5.2) t = 1 - (cycle - 4) / 1.2;
        else t = 0;
        this.x = outX + (inX - outX) * this.ease(t);
        r.facing = -1;
        r.lookX = -1.2;
        break;
      }
    }

    if (mode !== "drag") this.y = damp(this.y, this.stageH, 10, dt);

    // Particles
    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.life += dt;
      if (p.life < p.maxLife) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= (p.kind === "steam" ? 26 : 8) * dt;
        alive.push(p);
      }
    }
    this.particles = alive;
  }

  private ease(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private lookAtTarget(cell: number): void {
    const r = this.render;
    if (this.target) {
      const headX = this.x;
      const headY = this.y - this.catHeightPx() * 0.75;
      r.lookX = clamp((this.target.x - headX) / (cell * 8), -1.5, 1.5);
      r.lookY = clamp((this.target.y - headY) / (cell * 8), -1, 1);
      r.facing = this.target.x >= headX ? 1 : -1;
    } else {
      r.lookX = damp(r.lookX, 0, 3, 0.016);
      r.lookY = damp(r.lookY, 0, 3, 0.016);
    }
  }

  private draw(): void {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.stageW, this.stageH);
    ctx.imageSmoothingEnabled = false;

    const cell = this.cell();
    const catW = CAT_W * cell;
    const catH = CAT_H * cell;
    const groundPad = cell * 0.5;
    const originX = this.x - catW / 2;
    const originY = this.y - catH - groundPad + this.jumpY;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    const shScale = 1 - clamp(-this.jumpY / (this.stageH * 0.5), 0, 0.5);
    ctx.fillRect(
      this.x - (catW * 0.32 * shScale) / 1,
      this.y - groundPad,
      catW * 0.64 * shScale,
      cell * 0.8,
    );

    ctx.save();
    ctx.translate(Math.round(originX), Math.round(originY));
    drawCat({ ctx, cell, palette: CAT_PALETTES[this.variant], state: this.render });
    ctx.restore();

    this.drawParticles(cell);
  }

  private drawParticles(cell: number): void {
    const { ctx } = this;
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      const alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
      ctx.globalAlpha = clamp(alpha, 0, 1);
      const s = cell * p.size;
      switch (p.kind) {
        case "heart": {
          ctx.fillStyle = "#ff6b81";
          ctx.fillRect(p.x - s * 0.75, p.y - s * 0.5, s * 0.6, s * 0.6);
          ctx.fillRect(p.x + s * 0.15, p.y - s * 0.5, s * 0.6, s * 0.6);
          ctx.fillRect(p.x - s * 0.45, p.y, s * 0.9, s * 0.55);
          ctx.fillRect(p.x - s * 0.15, p.y + s * 0.4, s * 0.3, s * 0.3);
          break;
        }
        case "zzz": {
          ctx.fillStyle = "#9ecbff";
          ctx.font = `${Math.round(s * 1.6)}px monospace`;
          ctx.fillText("z", p.x, p.y);
          break;
        }
        case "steam": {
          ctx.fillStyle = "rgba(240,240,240,0.9)";
          ctx.fillRect(p.x, p.y, s * 0.8, s * 0.8);
          ctx.fillRect(p.x + s * 0.5, p.y - s * 0.6, s * 0.6, s * 0.6);
          break;
        }
        case "note": {
          ctx.fillStyle = "#ffd23f";
          ctx.fillRect(p.x, p.y, s * 0.35, s * 1.1);
          ctx.fillRect(p.x - s * 0.3, p.y + s * 0.85, s * 0.5, s * 0.45);
          ctx.fillRect(p.x, p.y, s * 0.8, s * 0.3);
          break;
        }
        case "sparkle": {
          ctx.fillStyle = "#ffd23f";
          ctx.fillRect(p.x - s * 0.15, p.y - s * 0.5, s * 0.3, s);
          ctx.fillRect(p.x - s * 0.5, p.y - s * 0.15, s, s * 0.3);
          break;
        }
      }
      ctx.globalAlpha = 1;
    }
  }
}
