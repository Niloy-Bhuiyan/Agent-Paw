"use client";

import { useSyncExternalStore } from "react";
import type { ConversationTurn } from "@/companion-pet/voice/types";

/* ============================================================
   Companion memory — everything the pet remembers about you,
   persisted to localStorage. A compact summary is sent as
   context with each voice conversation so live providers can
   personalize replies.
   ============================================================ */

export interface CompanionMemory {
  companionName: string;
  userName: string | null;
  greetingsCount: number;
  firstMetAt: number;
  lastSeenAt: number;
  favoriteModel: string | null;
  favoriteProject: string | null;
  goals: string[];
  achievements: string[];
  bestStreakDays: number;
  totalConversations: number;
  /** Recent voice turns (rolling window). */
  history: ConversationTurn[];
}

const STORAGE_KEY = "agentpaw.pet.memory.v1";
const HISTORY_LIMIT = 40;

const defaults = (): CompanionMemory => ({
  companionName: "AgentPaw",
  userName: null,
  greetingsCount: 0,
  firstMetAt: Date.now(),
  lastSeenAt: Date.now(),
  favoriteModel: null,
  favoriteProject: null,
  goals: [],
  achievements: [],
  bestStreakDays: 0,
  totalConversations: 0,
  history: [],
});

let memory: CompanionMemory = defaults();
let hydrated = false;
const listeners = new Set<() => void>();

const hydrate = () => {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) memory = { ...defaults(), ...(JSON.parse(raw) as Partial<CompanionMemory>) };
  } catch {
    memory = defaults();
  }
};

const persist = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    /* private mode — memory stays in-session */
  }
};

const notify = () => {
  for (const l of listeners) l();
};

export const companionMemory = {
  get(): CompanionMemory {
    hydrate();
    return memory;
  },
  set(patch: Partial<CompanionMemory>): void {
    hydrate();
    memory = { ...memory, ...patch, lastSeenAt: Date.now() };
    persist();
    notify();
  },
  addTurns(turns: ConversationTurn[]): void {
    hydrate();
    memory = {
      ...memory,
      history: [...memory.history, ...turns].slice(-HISTORY_LIMIT),
      lastSeenAt: Date.now(),
    };
    persist();
    notify();
  },
  recordAchievement(title: string): void {
    hydrate();
    if (memory.achievements.includes(title)) return;
    memory = { ...memory, achievements: [...memory.achievements, title].slice(-30) };
    persist();
    notify();
  },
  clearHistory(): void {
    hydrate();
    memory = { ...memory, history: [] };
    persist();
    notify();
  },
  forgetEverything(): void {
    memory = defaults();
    persist();
    notify();
  },
};

/** Compact context string sent to providers with each conversation. */
export const memoryContext = (): string => {
  const m = companionMemory.get();
  const parts: string[] = [`Your name is ${m.companionName}.`];
  if (m.userName) parts.push(`The user's name is ${m.userName} — greet them by name.`);
  if (m.goals.length) parts.push(`The user's goals: ${m.goals.slice(-3).join("; ")}.`);
  if (m.achievements.length)
    parts.push(`Recent achievements: ${m.achievements.slice(-3).join(", ")}.`);
  if (m.bestStreakDays > 0) parts.push(`Best coding streak: ${m.bestStreakDays} days.`);
  return parts.join(" ");
};

/** Heuristics that let the pet learn from what the user says. */
export const learnFromUtterance = (text: string): void => {
  const nameMatch = /(?:my name is|call me|i am|i'm)\s+([a-z][a-z-]{1,20})/i.exec(text);
  if (nameMatch?.[1]) {
    const name = nameMatch[1];
    companionMemory.set({ userName: name.charAt(0).toUpperCase() + name.slice(1) });
  }
  const goalMatch = /(?:my goal is|i want to|remind me to)\s+(.{4,80})/i.exec(text);
  if (goalMatch?.[1]) {
    const m = companionMemory.get();
    companionMemory.set({ goals: [...m.goals, goalMatch[1].trim()].slice(-8) });
  }
  const petNameMatch = /(?:i(?:'ll| will)? call you|your name is)\s+([a-z][a-z-]{1,20})/i.exec(text);
  if (petNameMatch?.[1]) {
    const name = petNameMatch[1];
    companionMemory.set({ companionName: name.charAt(0).toUpperCase() + name.slice(1) });
  }
};

const serverSnapshot = defaults();

export function useCompanionMemory<T>(selector: (m: CompanionMemory) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(companionMemory.get()),
    () => selector(serverSnapshot),
  );
}
