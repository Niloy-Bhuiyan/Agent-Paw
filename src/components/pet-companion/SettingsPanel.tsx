"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PERSONALITIES } from "@/companion-pet/dialogue";
import { allMetrics, METRIC_CATEGORIES } from "@/companion-pet/metrics";
import { REACTION_GROUPS } from "@/companion-pet/reactions";
import { petSettingsStore, usePetSettings, type PetSettings } from "@/companion-pet/settings";
import { companionMemory, useCompanionMemory } from "@/companion-pet/memory";
import { listMicrophones, type MicDevice } from "@/companion-pet/voice/audio";
import { WebSpeechSynth } from "@/companion-pet/voice/tts";
import { CAT_VARIANTS } from "@/animations/pixel-cat/palettes";
import type { TtsVoiceInfo } from "@/companion-pet/voice/types";

/* ============================================================
   Settings — every knob applies instantly (store → rerender),
   persists to localStorage, and never needs a refresh.
   ============================================================ */

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = usePetSettings((s) => s);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40 cursor-pointer bg-bg/70 backdrop-blur-[2px]"
          />
          <motion.aside
            role="dialog"
            aria-label="Pet settings"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l-2 border-fg bg-bg"
          >
            <header className="flex items-center justify-between border-b-2 border-fg px-5 py-3.5">
              <h2 className="pixel-heading text-[18px] tracking-[0.14em]">PET SETTINGS</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => petSettingsStore.reset()}
                  className="focus-pixel cursor-pointer border border-line px-2.5 py-1 text-[11px] tracking-[0.1em] text-fg-dim transition-colors hover:border-fg hover:text-fg"
                >
                  RESET
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="focus-pixel cursor-pointer border border-line px-2.5 py-1 text-[13px] text-fg-dim transition-colors hover:border-fg hover:text-fg"
                >
                  ✕
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
              {/* ---------- Companion ---------- */}
              <Section title="COMPANION">
                <Field label="Personality">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERSONALITIES.map((p) => (
                      <OptionButton
                        key={p.id}
                        active={settings.personality === p.id}
                        onClick={() => petSettingsStore.set({ personality: p.id })}
                        title={p.blurb}
                      >
                        {p.label}
                      </OptionButton>
                    ))}
                  </div>
                </Field>
                <Field label="Fur">
                  <div className="flex flex-wrap gap-1.5">
                    {CAT_VARIANTS.map((v) => (
                      <OptionButton
                        key={v}
                        active={settings.variant === v}
                        onClick={() => petSettingsStore.set({ variant: v })}
                      >
                        {v}
                      </OptionButton>
                    ))}
                  </div>
                </Field>
                <Field label={`Size · ${Math.round(settings.scale * 100)}%`}>
                  <input
                    type="range"
                    min={0.3}
                    max={0.65}
                    step={0.01}
                    value={settings.scale}
                    onChange={(e) => petSettingsStore.set({ scale: Number(e.target.value) })}
                    className="w-full accent-[#ffd23f]"
                    aria-label="Pet size"
                  />
                </Field>
                <Field label="Position">
                  <Choices<PetSettings["position"]>
                    options={["left", "center", "right"]}
                    value={settings.position}
                    onPick={(position) => petSettingsStore.set({ position })}
                  />
                </Field>
              </Section>

              {/* ---------- Look & motion ---------- */}
              <Section title="LOOK & MOTION">
                <Field label="Theme">
                  <Choices<PetSettings["theme"]>
                    options={["midnight", "terminal", "paper"]}
                    value={settings.theme}
                    onPick={(theme) => petSettingsStore.set({ theme })}
                  />
                </Field>
                <Field label="Bubble style">
                  <Choices<PetSettings["bubbleStyle"]>
                    options={["pixel", "round"]}
                    value={settings.bubbleStyle}
                    onPick={(bubbleStyle) => petSettingsStore.set({ bubbleStyle })}
                  />
                </Field>
                <Field label="Animation intensity">
                  <Choices<PetSettings["animationIntensity"]>
                    options={["low", "normal", "high"]}
                    value={settings.animationIntensity}
                    onPick={(animationIntensity) => petSettingsStore.set({ animationIntensity })}
                  />
                </Field>
                <Toggle
                  label="Particle effects"
                  checked={settings.particles}
                  onChange={(particles) => petSettingsStore.set({ particles })}
                />
                <Toggle
                  label="Sound hooks (needs a sound pack)"
                  checked={settings.sounds}
                  onChange={(sounds) => petSettingsStore.set({ sounds })}
                />
                <Toggle
                  label="Force reduced motion"
                  checked={settings.reducedMotionOverride}
                  onChange={(reducedMotionOverride) =>
                    petSettingsStore.set({ reducedMotionOverride })
                  }
                />
                <Toggle
                  label="Larger text"
                  checked={settings.largeText}
                  onChange={(largeText) => petSettingsStore.set({ largeText })}
                />
              </Section>

              {/* ---------- Voice ---------- */}
              <Section title="VOICE">
                <Toggle
                  label="Voice companion"
                  checked={settings.voice.enabled}
                  onChange={(enabled) => petSettingsStore.setVoice({ enabled })}
                />
                {settings.voice.enabled && <VoiceSettingsBody />}
              </Section>

              {/* ---------- Memory ---------- */}
              <Section title="MEMORY">
                <MemorySettingsBody />
              </Section>

              {/* ---------- Premium ---------- */}
              <Section title="PREMIUM (PREVIEW)">
                <PremiumSettingsBody />
              </Section>

              {/* ---------- Behavior ---------- */}
              <Section title="BEHAVIOR">
                <Field
                  label={`Chattiness · ${Math.round(settings.reactionFrequency * 100)}%`}
                >
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={settings.reactionFrequency}
                    onChange={(e) =>
                      petSettingsStore.set({ reactionFrequency: Number(e.target.value) })
                    }
                    className="w-full accent-[#ffd23f]"
                    aria-label="Reaction frequency"
                  />
                </Field>
                <Field label={`Sleep after idle · ${settings.idleToSleepMinutes} min`}>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={settings.idleToSleepMinutes}
                    onChange={(e) =>
                      petSettingsStore.set({ idleToSleepMinutes: Number(e.target.value) })
                    }
                    className="w-full accent-[#ffd23f]"
                    aria-label="Minutes before sleeping"
                  />
                </Field>
                <Field label={`Simulator tempo · ${settings.tempo.toFixed(1)}×`}>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={settings.tempo}
                    onChange={(e) => petSettingsStore.set({ tempo: Number(e.target.value) })}
                    className="w-full accent-[#ffd23f]"
                    aria-label="Simulator tempo"
                  />
                </Field>
                <Field label="Time format">
                  <Choices<PetSettings["timeFormat"]>
                    options={["24h", "12h"]}
                    value={settings.timeFormat}
                    onPick={(timeFormat) => petSettingsStore.set({ timeFormat })}
                  />
                </Field>
              </Section>

              {/* ---------- Budgets ---------- */}
              <Section title="TOKEN BUDGETS">
                <Field label="Daily budget (tokens)">
                  <NumberInput
                    value={settings.dailyTokenBudget}
                    onChange={(dailyTokenBudget) => petSettingsStore.set({ dailyTokenBudget })}
                  />
                </Field>
                <Field label="Monthly budget (tokens)">
                  <NumberInput
                    value={settings.monthlyTokenBudget}
                    onChange={(monthlyTokenBudget) =>
                      petSettingsStore.set({ monthlyTokenBudget })
                    }
                  />
                </Field>
              </Section>

              {/* ---------- Reactions ---------- */}
              <Section title="REACTIONS">
                {REACTION_GROUPS.map((group) => (
                  <Toggle
                    key={group.id}
                    label={group.label}
                    checked={settings.reactionGroups[group.id]}
                    onChange={(v) => petSettingsStore.setReactionGroup(group.id, v)}
                  />
                ))}
              </Section>

              {/* ---------- Metrics ---------- */}
              <Section title="DISPLAYED INFO">
                {METRIC_CATEGORIES.map((category) => (
                  <div key={category.id} className="mb-3">
                    <p className="pixel-heading mb-1.5 text-[10px] tracking-[0.2em] text-fg-dim">
                      {category.label.toUpperCase()}
                    </p>
                    <div className="space-y-1">
                      {allMetrics()
                        .filter((m) => m.category === category.id)
                        .map((m) => (
                          <Toggle
                            key={m.id}
                            label={`${m.icon} ${m.label}`}
                            checked={settings.metrics[m.id] ?? false}
                            onChange={(v) => petSettingsStore.setMetric(m.id, v)}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------------- voice / memory / premium sections ---------------- */

function VoiceSettingsBody() {
  const voice = usePetSettings((s) => s.voice);
  const [mics, setMics] = useState<MicDevice[]>([]);
  const [voices, setVoices] = useState<TtsVoiceInfo[]>([]);

  useEffect(() => {
    void listMicrophones().then(setMics);
    const synth = new WebSpeechSynth();
    if (!synth.available()) return;
    const load = () => setVoices(synth.voices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  return (
    <>
      <Field label="Speech recognition">
        <Choices
          options={["webspeech", "mock"] as const}
          value={voice.sttProvider}
          onPick={(sttProvider) => petSettingsStore.setVoice({ sttProvider })}
        />
      </Field>
      <Field label="Speech output">
        <Choices
          options={["webspeech", "mock"] as const}
          value={voice.ttsProvider}
          onPick={(ttsProvider) => petSettingsStore.setVoice({ ttsProvider })}
        />
      </Field>
      {voices.length > 0 && voice.ttsProvider === "webspeech" && (
        <Field label="Voice">
          <select
            value={voice.voiceId ?? ""}
            onChange={(e) => petSettingsStore.setVoice({ voiceId: e.target.value || null })}
            aria-label="TTS voice"
            className="focus-pixel w-full border-2 border-line bg-bg-2 px-2 py-1.5 text-[12px] text-fg"
          >
            <option value="">System default</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      {mics.length > 0 && (
        <Field label="Microphone">
          <select
            value={voice.micDeviceId ?? ""}
            onChange={(e) => petSettingsStore.setVoice({ micDeviceId: e.target.value || null })}
            aria-label="Microphone"
            className="focus-pixel w-full border-2 border-line bg-bg-2 px-2 py-1.5 text-[12px] text-fg"
          >
            <option value="">System default</option>
            {mics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={`Speech rate · ${voice.rate.toFixed(1)}×`}>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={voice.rate}
          onChange={(e) => petSettingsStore.setVoice({ rate: Number(e.target.value) })}
          className="w-full accent-[#ffd23f]"
          aria-label="Speech rate"
        />
      </Field>
      <Field label={`Pitch · ${voice.pitch.toFixed(1)}`}>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={voice.pitch}
          onChange={(e) => petSettingsStore.setVoice({ pitch: Number(e.target.value) })}
          className="w-full accent-[#ffd23f]"
          aria-label="Speech pitch"
        />
      </Field>
      <Field label="Hotkey (single key)">
        <input
          type="text"
          value={voice.hotkey}
          maxLength={1}
          onChange={(e) =>
            petSettingsStore.setVoice({ hotkey: e.target.value.toLowerCase() || "v" })
          }
          aria-label="Voice hotkey"
          className="focus-pixel w-16 border-2 border-line bg-bg-2 px-2 py-1.5 text-center font-mono text-[13px] uppercase text-fg"
        />
      </Field>
      <Field label="Activation">
        <Choices
          options={["toggle", "hold"] as const}
          value={voice.pttMode}
          onPick={(pttMode) => petSettingsStore.setVoice({ pttMode })}
        />
      </Field>
      <Toggle
        label="Speak replies aloud"
        checked={voice.speakReplies}
        onChange={(speakReplies) => petSettingsStore.setVoice({ speakReplies })}
      />
      <Toggle
        label="Noise suppression"
        checked={voice.noiseSuppression}
        onChange={(noiseSuppression) => petSettingsStore.setVoice({ noiseSuppression })}
      />
      <Toggle
        label="Always listening (continuous)"
        checked={voice.alwaysListening}
        onChange={(alwaysListening) => petSettingsStore.setVoice({ alwaysListening })}
      />
      {voice.alwaysListening && (
        <>
          <Toggle
            label="Require wake word"
            checked={voice.wakeWordEnabled}
            onChange={(wakeWordEnabled) => petSettingsStore.setVoice({ wakeWordEnabled })}
          />
          {voice.wakeWordEnabled && (
            <Field label="Wake word">
              <input
                type="text"
                value={voice.wakeWord}
                onChange={(e) => petSettingsStore.setVoice({ wakeWord: e.target.value })}
                aria-label="Wake word"
                className="focus-pixel w-full border-2 border-line bg-bg-2 px-2 py-1.5 font-mono text-[12px] text-fg"
              />
            </Field>
          )}
        </>
      )}
    </>
  );
}

function MemorySettingsBody() {
  const memory = useCompanionMemory((m) => m);
  return (
    <>
      <Field label="Companion name">
        <input
          type="text"
          value={memory.companionName}
          maxLength={20}
          onChange={(e) => companionMemory.set({ companionName: e.target.value || "AgentPaw" })}
          aria-label="Companion name"
          className="focus-pixel w-full border-2 border-line bg-bg-2 px-2 py-1.5 font-mono text-[12px] text-fg"
        />
      </Field>
      <Field label="Your name (it learns this from conversation too)">
        <input
          type="text"
          value={memory.userName ?? ""}
          maxLength={20}
          placeholder="—"
          onChange={(e) => companionMemory.set({ userName: e.target.value || null })}
          aria-label="Your name"
          className="focus-pixel w-full border-2 border-line bg-bg-2 px-2 py-1.5 font-mono text-[12px] text-fg placeholder:text-fg-dim/50"
        />
      </Field>
      <p className="text-[11px] leading-relaxed text-fg-dim">
        {memory.totalConversations} conversations · {memory.goals.length} remembered goals ·
        met {new Date(memory.firstMetAt).toLocaleDateString()}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => companionMemory.clearHistory()}
          className="focus-pixel cursor-pointer border border-line px-2.5 py-1.5 text-[11px] text-fg-dim transition-colors hover:border-fg hover:text-fg"
        >
          Clear history
        </button>
        <button
          type="button"
          onClick={() => companionMemory.forgetEverything()}
          className="focus-pixel cursor-pointer border border-line px-2.5 py-1.5 text-[11px] text-fg-dim transition-colors hover:border-[#e2574c] hover:text-[#e2574c]"
        >
          Forget everything
        </button>
      </div>
    </>
  );
}

function PremiumSettingsBody() {
  const premium = usePetSettings((s) => s.premium);
  return (
    <>
      <Toggle
        label="Premium mode (local preview)"
        checked={premium.enabled}
        onChange={(enabled) => petSettingsStore.setPremium({ enabled })}
      />
      {(
        [
          ["multiCompanion", "Multi-companion support"],
          ["naturalVoices", "Natural voice personalities"],
          ["cloudMemory", "Cloud memory & sync"],
          ["marketplace", "Companion marketplace"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className={premium.enabled ? "" : "pointer-events-none opacity-40"}>
          <Toggle
            label={`${label} 🔒`}
            checked={premium[key]}
            onChange={(v) => petSettingsStore.setPremium({ [key]: v })}
          />
        </div>
      ))}
      <p className="text-[10.5px] leading-relaxed text-fg-dim/80">
        Architecture-ready flags. Each capability degrades gracefully: nothing here is required
        for the core companion, and enabling a flag without its backend simply keeps the local
        behavior. See docs/VOICE_COMPANION.md → Premium.
      </p>
    </>
  );
}

/* ---------------- small building blocks ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="pixel-heading mb-3 border-b border-line pb-1.5 text-[13px] tracking-[0.2em] text-pop">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] text-fg-dim">{label}</p>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={`focus-pixel cursor-pointer border px-2.5 py-1.5 text-[12px] capitalize transition-colors ${
        active ? "border-pop bg-pop/15 text-pop" : "border-line text-fg-dim hover:border-fg hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function Choices<T extends string>({
  options,
  value,
  onPick,
}: {
  options: readonly T[];
  value: T;
  onPick: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <OptionButton key={option} active={value === option} onClick={() => onPick(option)}>
          {option}
        </OptionButton>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-0.5">
      <span className="text-[12.5px] text-fg">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`focus-pixel relative h-5 w-9 shrink-0 cursor-pointer border transition-colors ${
          checked ? "border-pop bg-pop/25" : "border-line bg-bg-2"
        }`}
      >
        <span
          className={`absolute top-1/2 size-3 -translate-y-1/2 transition-[left] duration-150 ${
            checked ? "left-[18px] bg-pop" : "left-[3px] bg-fg-dim"
          }`}
        />
      </button>
    </label>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step={1000}
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className="focus-pixel w-full border-2 border-line bg-bg-2 px-3 py-2 font-mono text-[13px] text-fg"
    />
  );
}
