"use client";

import { useSyncExternalStore } from "react";
import { allMetrics } from "@/companion-pet/metrics";
import type { PersonalityId } from "@/companion-pet/dialogue";
import type { ReactionGroup } from "@/companion-pet/types";
import type { CatVariant } from "@/types";

/* ============================================================
   Pet settings — schema, defaults, persistence (localStorage),
   and a useSyncExternalStore-backed store. Every change applies
   instantly; nothing requires a refresh.
   ============================================================ */

export type BubbleStyle = "pixel" | "round";
export type AnimationIntensity = "low" | "normal" | "high";
export type PetPosition = "left" | "center" | "right";
export type StageTheme = "midnight" | "terminal" | "paper";
export type TimeFormat = "24h" | "12h";

export type SttProviderId = "webspeech" | "mock";
export type TtsProviderId = "webspeech" | "mock";
export type PttMode = "toggle" | "hold";

export interface VoiceSettings {
  enabled: boolean;
  sttProvider: SttProviderId;
  ttsProvider: TtsProviderId;
  voiceId: string | null;
  rate: number; // 0.5 – 2
  pitch: number; // 0.5 – 2
  micDeviceId: string | null;
  noiseSuppression: boolean;
  hotkey: string; // single key, e.g. "v"
  pttMode: PttMode;
  wakeWordEnabled: boolean;
  wakeWord: string;
  alwaysListening: boolean;
  speakReplies: boolean;
  lang: string;
}

export interface PremiumSettings {
  /** Master flag — everything degrades gracefully when off. */
  enabled: boolean;
  multiCompanion: boolean;
  cloudMemory: boolean;
  naturalVoices: boolean;
  marketplace: boolean;
}

export interface PetSettings {
  personality: PersonalityId;
  variant: CatVariant;
  scale: number; // 0.3 – 0.65
  position: PetPosition;
  theme: StageTheme;
  bubbleStyle: BubbleStyle;
  animationIntensity: AnimationIntensity;
  particles: boolean;
  sounds: boolean; // hooks only; OFF by default
  reducedMotionOverride: boolean;
  largeText: boolean;
  timeFormat: TimeFormat;
  idleToSleepMinutes: number;
  breakReminderMinutes: number;
  reactionFrequency: number; // 0.2 – 1: chance a non-critical reaction shows a bubble
  dailyTokenBudget: number;
  monthlyTokenBudget: number;
  tempo: number; // simulator busyness
  reactionGroups: Record<ReactionGroup, boolean>;
  metrics: Record<string, boolean>;
  voice: VoiceSettings;
  premium: PremiumSettings;
}

const STORAGE_KEY = "agentpaw.pet.settings.v1";

export const defaultSettings = (): PetSettings => ({
  personality: "playful",
  variant: "orange",
  scale: 0.42,
  position: "center",
  theme: "midnight",
  bubbleStyle: "pixel",
  animationIntensity: "normal",
  particles: true,
  sounds: false,
  reducedMotionOverride: false,
  largeText: false,
  timeFormat: "24h",
  idleToSleepMinutes: 3,
  breakReminderMinutes: 20,
  reactionFrequency: 0.85,
  dailyTokenBudget: 25000,
  monthlyTokenBudget: 600000,
  tempo: 1,
  reactionGroups: {
    ai: true,
    "build-test": true,
    git: true,
    files: true,
    system: true,
    wellness: true,
    gamification: true,
  },
  metrics: Object.fromEntries(allMetrics().map((m) => [m.id, m.defaultEnabled])),
  voice: {
    enabled: true,
    sttProvider: "webspeech",
    ttsProvider: "webspeech",
    voiceId: null,
    rate: 1,
    pitch: 1,
    micDeviceId: null,
    noiseSuppression: true,
    hotkey: "v",
    pttMode: "toggle",
    wakeWordEnabled: false,
    wakeWord: "hey cat",
    alwaysListening: false,
    speakReplies: true,
    lang: "en-US",
  },
  premium: {
    enabled: false,
    multiCompanion: false,
    cloudMemory: false,
    naturalVoices: false,
    marketplace: false,
  },
});

let settings: PetSettings = defaultSettings();
let hydrated = false;
const listeners = new Set<() => void>();

const persist = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable (private mode etc.) — settings stay in memory
  }
};

const hydrate = () => {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as Partial<PetSettings>;
    const defaults = defaultSettings();
    settings = {
      ...defaults,
      ...stored,
      reactionGroups: { ...defaults.reactionGroups, ...stored.reactionGroups },
      metrics: { ...defaults.metrics, ...stored.metrics },
      voice: { ...defaults.voice, ...stored.voice },
      premium: { ...defaults.premium, ...stored.premium },
    };
  } catch {
    settings = defaultSettings();
  }
};

const notify = () => {
  for (const listener of listeners) listener();
};

export const petSettingsStore = {
  get(): PetSettings {
    hydrate();
    return settings;
  },
  set(patch: Partial<PetSettings>): void {
    settings = { ...settings, ...patch };
    persist();
    notify();
  },
  setMetric(id: string, enabled: boolean): void {
    settings = { ...settings, metrics: { ...settings.metrics, [id]: enabled } };
    persist();
    notify();
  },
  setVoice(patch: Partial<VoiceSettings>): void {
    settings = { ...settings, voice: { ...settings.voice, ...patch } };
    persist();
    notify();
  },
  setPremium(patch: Partial<PremiumSettings>): void {
    settings = { ...settings, premium: { ...settings.premium, ...patch } };
    persist();
    notify();
  },
  setReactionGroup(id: ReactionGroup, enabled: boolean): void {
    settings = {
      ...settings,
      reactionGroups: { ...settings.reactionGroups, [id]: enabled },
    };
    persist();
    notify();
  },
  reset(): void {
    settings = defaultSettings();
    persist();
    notify();
  },
};

const serverSnapshot = defaultSettings();

export function usePetSettings<T>(selector: (s: PetSettings) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(petSettingsStore.get()),
    () => selector(serverSnapshot),
  );
}
