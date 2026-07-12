import { en, type MessageKey } from "./en";
import { ko } from "./ko";
import type { Locale } from "@/types";

export type { MessageKey };

export const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, ko };

export const localeNames: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
};

export const defaultLocale: Locale = "en";

export const translate = (locale: Locale, key: MessageKey): string =>
  dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key;
