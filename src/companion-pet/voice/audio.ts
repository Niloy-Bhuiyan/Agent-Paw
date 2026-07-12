import type { MicLevels } from "@/companion-pet/voice/types";

/* ============================================================
   Microphone metering: getUserMedia + AnalyserNode.
   Drives the waveform visualization and a simple adaptive
   voice-activity detector. Fully optional — when permission is
   denied (or in mock mode) the UI falls back to a synthetic
   idle waveform, so nothing breaks.
   ============================================================ */

export interface MicDevice {
  id: string;
  label: string;
}

export const listMicrophones = async (): Promise<MicDevice[]> => {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === "audioinput")
      .map((d, i) => ({ id: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
  } catch {
    return [];
  }
};

export class MicMeter {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private raf = 0;
  private noiseFloor = 0.02;
  private smoothed = 0;

  async start(opts: {
    deviceId?: string;
    noiseSuppression: boolean;
    onLevels: (levels: MicLevels) => void;
    onError: (message: string) => void;
  }): Promise<void> {
    this.stop();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      opts.onError("Microphone access is not available in this browser.");
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined,
          noiseSuppression: opts.noiseSuppression,
          echoCancellation: true,
          autoGainControl: true,
        },
      });
    } catch {
      opts.onError("Microphone permission denied — waveform will be simulated.");
      return;
    }

    this.context = new AudioContext();
    const source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.7;
    source.connect(this.analyser);

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const loop = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(data);
      let sum = 0;
      const bins: number[] = [];
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] ?? 0) / 255;
        sum += v;
        if (i % 2 === 0) bins.push(v);
      }
      const raw = sum / data.length;
      this.smoothed = this.smoothed * 0.8 + raw * 0.2;
      // Adaptive noise floor: drift toward quiet levels.
      if (raw < this.noiseFloor) this.noiseFloor = this.noiseFloor * 0.995 + raw * 0.005;
      else this.noiseFloor = Math.min(this.noiseFloor * 1.001, 0.08);

      opts.onLevels({
        level: this.smoothed,
        bins,
        voice: this.smoothed > this.noiseFloor * 2.5 + 0.015,
      });
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.context?.close().catch(() => undefined);
    this.stream = null;
    this.context = null;
    this.analyser = null;
  }
}

/** Synthetic idle waveform for mock mode / denied permission. */
export const syntheticLevels = (t: number, active: boolean): MicLevels => {
  const base = active ? 0.35 : 0.06;
  const bins = Array.from({ length: 16 }, (_, i) => {
    const wave = Math.sin(t / 180 + i * 0.9) * 0.5 + 0.5;
    return base * wave + (active ? Math.random() * 0.25 : 0.02);
  });
  return { level: base, bins, voice: active };
};
