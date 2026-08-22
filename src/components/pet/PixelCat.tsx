"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CatEngine } from "@/animations/pixel-cat/engine";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { CatMode, CatVariant } from "@/types";

export interface PixelCatHandle {
  engine: CatEngine | null;
}

export interface PixelCatProps {
  variant?: CatVariant;
  mode?: CatMode;
  /** Cat height as a fraction of stage height. */
  scale?: number;
  /** Track pointer for eyes / hunting / petting. */
  interactive?: boolean;
  /** Allow drag control (mochi mode). */
  draggable?: boolean;
  /** Jump when clicked. */
  jumpOnClick?: boolean;
  className?: string;
  onMeow?: () => void;
  ariaLabel?: string;
}

/**
 * Canvas-backed animated pixel cat. All rendering happens in the shared
 * CatEngine; this component owns lifecycle, sizing and pointer plumbing.
 */
export const PixelCat = forwardRef<PixelCatHandle, PixelCatProps>(function PixelCat(
  {
    variant = "orange",
    mode = "sit",
    scale,
    interactive = true,
    draggable = false,
    jumpOnClick = false,
    className,
    onMeow,
    ariaLabel = "Animated pixel cat",
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CatEngine | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useImperativeHandle(ref, () => ({
    get engine() {
      return engineRef.current;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new CatEngine(canvas, { variant, mode, scale, reducedMotion, onMeow });
    engineRef.current = engine;

    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(canvas);

    // Pause the loop entirely when off-screen (perf budget).
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) engine.start();
          else engine.stop();
        }
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(canvas);

    return () => {
      observer.disconnect();
      io.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // The engine is created once; live prop updates are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setVariant(variant);
  }, [variant]);

  useEffect(() => {
    engineRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    if (scale !== undefined) engineRef.current?.setScale(scale);
  }, [scale]);

  const toStage = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    const p = toStage(e);
    if (interactive) {
      engine.setPointer(p);
      // Petting: pointer moving over the upper half of the stage.
      if (p.y < e.currentTarget.clientHeight * 0.55) engine.pet();
    }
    if (draggable) engine.moveDrag(p.x, p.y);
  };

  const handleLeave = () => {
    engineRef.current?.setPointer(null);
    engineRef.current?.endDrag();
  };

  const downInfo = useRef<{ t: number; x: number; y: number } | null>(null);

  const handleDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    downInfo.current = { t: performance.now(), x: e.clientX, y: e.clientY };
    if (draggable) {
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = toStage(e);
      engine.startDrag(p.x, p.y);
    } else if (jumpOnClick) {
      engine.jump();
    }
  };

  const handleUp = (e?: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    engine?.endDrag();
    // When both draggable and jumpOnClick: a quick tap (no real movement)
    // still jumps; a hold-and-move is a drag, not a jump.
    if (engine && draggable && jumpOnClick && e && downInfo.current) {
      const dt = performance.now() - downInfo.current.t;
      const moved = Math.hypot(e.clientX - downInfo.current.x, e.clientY - downInfo.current.y);
      if (dt < 260 && moved < 8) engine.jump();
    }
    downInfo.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      className={className ?? "h-full w-full"}
      style={{ imageRendering: "pixelated", touchAction: draggable ? "none" : undefined }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    />
  );
});
