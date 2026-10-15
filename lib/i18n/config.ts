// Supported locales. French is the default and the fallback for missing keys.
export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

// Right-to-left locales (Arabic).
export const RTL_LOCALES: Locale[] = ["ar"];

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

// Flag per locale (emoji, no assets, renders across platforms).
// Note: Arabic (ar) intentionally uses the Algeria flag per product request.
export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: "🇫🇷", // France
  ar: "🇩🇿", // Algeria
  en: "🇬🇧", // Great Britain
};

export const LOCALE_COOKIE = "mangeqr_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirForLocale(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
