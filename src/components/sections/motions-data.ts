import type { MessageKey } from "@/lib/i18n";

export type DemoKind =
  | "pattern"
  | "eyes"
  | "mochi"
  | "hunt"
  | "purr"
  | "knead"
  | "overheat"
  | "stretch"
  | "paper"
  | "think"
  | "celebrate"
  | "pomodoro"
  | "reminder"
  | "fixed-message"
  | "tell-name"
  | "multi"
  | "peek";

export interface MotionCardDef {
  id: string;
  demo: DemoKind;
  titleKey: MessageKey;
  descKey: MessageKey;
  hintKey?: MessageKey;
}

/** The 17 motion cards, in reference order. */
export const MOTION_CARDS: MotionCardDef[] = [
  { id: "custom-fur", demo: "pattern", titleKey: "motion.fur.title", descKey: "motion.fur.desc", hintKey: "motion.fur.hint" },
  { id: "eye-follow", demo: "eyes", titleKey: "motion.eye.title", descKey: "motion.eye.desc", hintKey: "motion.eye.hint" },
  { id: "mochi-drag", demo: "mochi", titleKey: "motion.mochi.title", descKey: "motion.mochi.desc", hintKey: "motion.mochi.hint" },
  { id: "mouse-hunt", demo: "hunt", titleKey: "motion.hunting.title", descKey: "motion.hunting.desc", hintKey: "motion.hunting.hint" },
  { id: "purring-pet", demo: "purr", titleKey: "motion.purring.title", descKey: "motion.purring.desc", hintKey: "motion.purring.hint" },
  { id: "keyboard-kneading", demo: "knead", titleKey: "motion.kneading.title", descKey: "motion.kneading.desc", hintKey: "motion.kneading.hint" },
  { id: "overheat-mode", demo: "overheat", titleKey: "motion.overheat.title", descKey: "motion.overheat.desc", hintKey: "motion.overheat.hint" },
  { id: "stretch-reminder", demo: "stretch", titleKey: "motion.reminder.title", descKey: "motion.reminder.desc", hintKey: "motion.reminder.hint" },
  { id: "paper-unroll", demo: "paper", titleKey: "motion.paper.title", descKey: "motion.paper.desc", hintKey: "motion.paper.hint" },
  { id: "ai-think", demo: "think", titleKey: "motion.aithink.title", descKey: "motion.aithink.desc" },
  { id: "agent-done-jump", demo: "celebrate", titleKey: "motion.aijump.title", descKey: "motion.aijump.desc" },
  { id: "pomodoro-timer", demo: "pomodoro", titleKey: "motion.pomodoro.title", descKey: "motion.pomodoro.desc", hintKey: "motion.pomodoro.hint" },
  { id: "message-reminder", demo: "reminder", titleKey: "motion.messageReminder.title", descKey: "motion.messageReminder.desc" },
  { id: "fixed-message", demo: "fixed-message", titleKey: "motion.fixedMessage.title", descKey: "motion.fixedMessage.desc" },
  { id: "tell-name", demo: "tell-name", titleKey: "motion.tellName.title", descKey: "motion.tellName.desc", hintKey: "motion.tellName.hint" },
  { id: "multi-device-license", demo: "multi", titleKey: "motion.multiple.title", descKey: "motion.multiple.desc" },
  { id: "peek-mode", demo: "peek", titleKey: "motion.peek.title", descKey: "motion.peek.desc" },
];
