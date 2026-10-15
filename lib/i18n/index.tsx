"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirForLocale,
  isLocale,
  type Locale,
} from "./config";
import { type TranslationKey } from "./dictionaries";
// `translate` lives in a pure (React-free) module so server components can import
// it without tripping over this file's client-only exports (I18nProvider/useI18n).
// Re-exported here for backward compatibility with existing `@/lib/i18n` imports.
import { translate } from "./translate";

export { translate };

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocale(initial?: Locale): Locale {
  if (initial && isLocale(initial)) return initial;
  if (typeof document !== "undefined") {
    // cookie
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`)
    );
    if (match && isLocale(match[1])) return match[1] as Locale;
    // localStorage
    const stored = window.localStorage?.getItem(LOCALE_COOKIE);
    if (stored && isLocale(stored)) return stored;
  }
  return DEFAULT_LOCALE;
}

/**
 * App-wide i18n provider. `initialLocale` can be passed from a server component
 * (read from the cookie) to avoid a flash; otherwise it self-initializes.
 */
export function I18nProvider({
  children,
  initialLocale,
  isolated = false,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  /**
   * When true, the provider is fully self-contained: `setLocale` only updates
   * this subtree's React state and does NOT write the cookie/localStorage or
   * mutate `document.documentElement` lang/dir. Used by the owner-facing menu
   * PREVIEW so switching the previewed menu's language never leaks into the
   * whole app (BUG: preview language changed the app language).
   */
  isolated?: boolean;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(() =>
    readInitialLocale(initialLocale)
  );

  const applyDir = useCallback((loc: Locale) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = loc;
      document.documentElement.dir = dirForLocale(loc);
    }
  }, []);

  useEffect(() => {
    // Isolated providers must not touch the global document direction/lang.
    if (isolated) return;
    applyDir(locale);
  }, [locale, applyDir, isolated]);

  const setLocale = useCallback(
    (loc: Locale) => {
      setLocaleState(loc);
      // Isolated preview: keep language local only — no global persistence, no
      // document mutation, and NO router refresh, so the app around it is
      // unaffected.
      if (isolated) return;
      if (typeof document !== "undefined") {
        // 1 year cookie + localStorage for persistence.
        document.cookie = `${LOCALE_COOKIE}=${loc}; path=/; max-age=31536000; samesite=lax`;
        window.localStorage?.setItem(LOCALE_COOKIE, loc);
      }
      applyDir(loc);

      // Re-render SERVER components against the new cookie.
      //
      // Without this, switching language only updated client components. Any page
      // that resolves strings on the server — /settings and /performances both
      // do, passing translated text down as props — kept rendering the language
      // from the last server response, so the screen ended up half Arabic and
      // half French until a hard reload. router.refresh() preserves client state,
      // so in-progress form input survives the switch.
      router.refresh();
    },
    [applyDir, isolated, router]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: dirForLocale(locale),
      setLocale,
      t: (key: TranslationKey) => translate(locale, key),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback if used outside a provider (e.g. isolated component):
    // return French, no-op setter.
    return {
      locale: DEFAULT_LOCALE,
      dir: "ltr",
      setLocale: () => {},
      t: (key: TranslationKey) => translate(DEFAULT_LOCALE, key),
    };
  }
  return ctx;
}

/** Convenience hook returning just the translator. */
export function useT() {
  return useI18n().t;
}
