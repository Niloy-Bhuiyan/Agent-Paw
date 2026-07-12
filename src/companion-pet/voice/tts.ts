import type { TtsAdapter, TtsVoiceInfo } from "@/companion-pet/voice/types";

/* ============================================================
   Text-to-speech adapters.
   - WebSpeechSynth: the browser's built-in speechSynthesis
     (offline, no keys). Voice, rate and pitch are configurable.
   - MockSynth: silent but time-accurate — fires boundaries and
     onEnd on a realistic schedule so animations, indicators and
     interruption all behave identically without audio.
   ============================================================ */

export class WebSpeechSynth implements TtsAdapter {
  readonly id = "webspeech" as const;
  readonly label = "Browser speech synthesis";

  available(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  voices(): TtsVoiceInfo[] {
    if (!this.available()) return [];
    return window.speechSynthesis.getVoices().map((v) => ({
      id: v.voiceURI,
      label: `${v.name} (${v.lang})`,
      lang: v.lang,
    }));
  }

  speak(opts: Parameters<TtsAdapter["speak"]>[0]): void {
    if (!this.available()) {
      opts.onError("Speech synthesis unavailable.");
      return;
    }
    this.cancel();
    const utterance = new SpeechSynthesisUtterance(opts.text);
    utterance.rate = opts.rate;
    utterance.pitch = opts.pitch;
    if (opts.voiceId) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === opts.voiceId);
      if (voice) utterance.voice = voice;
    }
    utterance.onboundary = () => opts.onBoundary?.();
    utterance.onend = () => opts.onEnd();
    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return; // expected on interrupt
      opts.onError(`Speech synthesis error: ${e.error}`);
    };
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if (this.available()) window.speechSynthesis.cancel();
  }

  pause(): void {
    if (this.available()) window.speechSynthesis.pause();
  }

  resume(): void {
    if (this.available()) window.speechSynthesis.resume();
  }

  get speaking(): boolean {
    return this.available() && window.speechSynthesis.speaking;
  }
}

export class MockSynth implements TtsAdapter {
  readonly id = "mock" as const;
  readonly label = "Silent (mock TTS)";
  private timers: ReturnType<typeof setTimeout>[] = [];
  private active = false;
  private paused = false;

  available(): boolean {
    return true;
  }

  voices(): TtsVoiceInfo[] {
    return [{ id: "mock-cat", label: "Silent Cat (mock)", lang: "en-US" }];
  }

  speak(opts: Parameters<TtsAdapter["speak"]>[0]): void {
    this.cancel();
    this.active = true;
    // ~160 wpm baseline scaled by rate; boundary tick per word.
    const words = Math.max(1, opts.text.split(/\s+/).length);
    const msPerWord = 375 / Math.max(0.5, opts.rate);
    for (let i = 1; i <= words; i++) {
      this.timers.push(
        setTimeout(() => {
          if (this.active && !this.paused) opts.onBoundary?.();
        }, i * msPerWord),
      );
    }
    this.timers.push(
      setTimeout(() => {
        if (this.active) {
          this.active = false;
          opts.onEnd();
        }
      }, words * msPerWord + 200),
    );
  }

  cancel(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.active = false;
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  get speaking(): boolean {
    return this.active;
  }
}

/** Factory — extend here to plug in cloud/natural-voice adapters later. */
export const createSynth = (preferred: "webspeech" | "mock"): TtsAdapter => {
  if (preferred === "webspeech") {
    const web = new WebSpeechSynth();
    if (web.available()) return web;
  }
  return new MockSynth();
};

/** Strip markdown so TTS reads prose, not syntax (keeps hyphenated words intact). */
export const speakableText = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, " — code block — ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[\s>#*-]+/gm, "") // list/heading/quote markers at line starts
    .replace(/(\*\*?|__?|~~)/g, "") // emphasis markers
    .replace(/\|/g, ", ") // table pipes read as pauses
    .replace(/\s+/g, " ")
    .trim();
