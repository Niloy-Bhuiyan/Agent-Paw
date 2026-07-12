import type { SttAdapter } from "@/companion-pet/voice/types";

/* ============================================================
   Speech-to-text adapters.
   - WebSpeechRecognizer: the browser's built-in streaming
     recognizer (Chrome/Edge; needs mic permission, no API key).
   - MockRecognizer: keeps the loop working everywhere — the UI
     shows a "type what you'd say" field that feeds transcripts
     through the exact same interface.
   ============================================================ */

/* Minimal typings for the (non-standard) Web Speech API. */
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

const getRecognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export class WebSpeechRecognizer implements SttAdapter {
  readonly id = "webspeech" as const;
  readonly label = "Browser speech recognition";
  private recognition: SpeechRecognitionLike | null = null;

  available(): boolean {
    return getRecognitionCtor() !== null;
  }

  start(opts: Parameters<SttAdapter["start"]>[0]): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      opts.onError("Speech recognition is not available in this browser.");
      return;
    }
    this.stop();
    const rec = new Ctor();
    this.recognition = rec;
    rec.lang = opts.lang;
    rec.continuous = opts.continuous;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result) continue;
        if (result.isFinal) {
          opts.onResult({ transcript: result[0].transcript.trim(), final: true });
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) opts.onResult({ transcript: interim.trim(), final: false });
    };
    rec.onend = () => {
      this.recognition = null;
      opts.onEnd();
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return; // benign
      opts.onError(
        e.error === "not-allowed"
          ? "Microphone permission was denied."
          : `Speech recognition error: ${e.error}`,
      );
    };
    try {
      rec.start();
    } catch {
      opts.onError("Could not start speech recognition.");
    }
  }

  stop(): void {
    try {
      this.recognition?.stop();
    } catch {
      /* already stopped */
    }
    this.recognition = null;
  }
}

/**
 * Mock recognizer: transcripts are injected by the UI (a text field),
 * flowing through the same onResult callback as real recognition —
 * including a simulated interim phase for realistic streaming UX.
 */
export class MockRecognizer implements SttAdapter {
  readonly id = "mock" as const;
  readonly label = "Typed input (mock STT)";
  private active = false;
  private handlers: Parameters<SttAdapter["start"]>[0] | null = null;

  available(): boolean {
    return true;
  }

  start(opts: Parameters<SttAdapter["start"]>[0]): void {
    this.active = true;
    this.handlers = opts;
  }

  stop(): void {
    const wasActive = this.active;
    this.active = false;
    if (wasActive) this.handlers?.onEnd();
    this.handlers = null;
  }

  /** Called by the UI when the user submits typed "speech". */
  inject(transcript: string): void {
    if (!this.active || !this.handlers) return;
    const words = transcript.split(" ");
    let shown = "";
    // Simulate word-by-word interim results before the final one.
    words.forEach((word, i) => {
      setTimeout(() => {
        if (!this.active || !this.handlers) return;
        shown = shown ? `${shown} ${word}` : word;
        const isLast = i === words.length - 1;
        this.handlers.onResult({ transcript: shown, final: isLast });
        if (isLast) this.stop();
      }, i * 90);
    });
  }
}

/** Factory — extend here to plug in cloud STT adapters later. */
export const createRecognizer = (preferred: "webspeech" | "mock"): SttAdapter => {
  if (preferred === "webspeech") {
    const web = new WebSpeechRecognizer();
    if (web.available()) return web;
  }
  return new MockRecognizer();
};
