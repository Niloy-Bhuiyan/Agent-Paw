/* ============================================================
   Voice engine — adapter contracts.
   STT and TTS are pluggable: the Web Speech adapters use the
   browser's built-in engines (no keys, no network cost); mock
   adapters keep the whole conversation loop working anywhere.
   Register new adapters via the factories in stt.ts / tts.ts.
   ============================================================ */

export type VoicePhase =
  | "idle"
  | "listening"
  | "transcribing" // final transcript captured, about to send
  | "thinking" // waiting for the model's first token
  | "responding" // streaming text
  | "speaking" // TTS playing
  | "error";

export interface SttResult {
  transcript: string;
  /** False while interim (streaming recognition). */
  final: boolean;
}

export interface SttAdapter {
  readonly id: "webspeech" | "mock";
  readonly label: string;
  /** Whether this adapter can run in the current browser. */
  available(): boolean;
  start(opts: {
    lang: string;
    continuous: boolean;
    onResult: (result: SttResult) => void;
    onEnd: () => void;
    onError: (message: string) => void;
  }): void;
  stop(): void;
}

export interface TtsVoiceInfo {
  id: string;
  label: string;
  lang: string;
}

export interface TtsAdapter {
  readonly id: "webspeech" | "mock";
  readonly label: string;
  available(): boolean;
  voices(): TtsVoiceInfo[];
  speak(opts: {
    text: string;
    voiceId?: string;
    rate: number;
    pitch: number;
    onBoundary?: () => void;
    onEnd: () => void;
    onError: (message: string) => void;
  }): void;
  /** Interrupt immediately. */
  cancel(): void;
  pause(): void;
  resume(): void;
  readonly speaking: boolean;
}

export interface MicLevels {
  /** 0..1 smoothed input level for waveform/VAD. */
  level: number;
  /** Snapshot of frequency bins, 0..1 each, for the waveform bars. */
  bins: number[];
  /** Simple voice-activity flag (level above adaptive floor). */
  voice: boolean;
}

export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  /** Which tool produced this turn, when routed locally. */
  tool?: string;
  at: number;
}
