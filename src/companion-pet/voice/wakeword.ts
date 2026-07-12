/* ============================================================
   Wake-word architecture.
   True always-on wake words need a local keyword-spotting model
   (e.g. an ONNX/WASM detector) — that slot is the `WakeWordEngine`
   interface below. The shipped `TranscriptWakeMatcher` piggybacks
   on streaming STT transcripts: cheap, key-free, and good enough
   for "hey cat" while a real detector can be plugged in later
   without touching the conversation loop.
   ============================================================ */

export interface WakeWordEngine {
  readonly id: string;
  /** Begin watching; resolve detection through the callback. */
  start(onWake: () => void): void;
  stop(): void;
}

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Matches the wake phrase inside streaming transcripts. */
export class TranscriptWakeMatcher {
  constructor(private phrase: string) {}

  setPhrase(phrase: string): void {
    this.phrase = phrase;
  }

  /** Returns the remainder after the wake phrase, or null if absent. */
  match(transcript: string): string | null {
    const wake = normalize(this.phrase);
    if (!wake) return null;
    const text = normalize(transcript);
    const idx = text.indexOf(wake);
    if (idx === -1) return null;
    return transcript.slice(idx + wake.length).trim() || "";
  }
}
