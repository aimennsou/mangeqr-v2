import { DEFAULT_LOCALE, type Locale } from './config';
import { DICTIONARIES, type TranslationKey } from './dictionaries';

/**
 * Pure, framework-agnostic translator (NO React) so it is safe to import from
 * SERVER components.
 *
 * This lives in its own module — separate from `index.tsx`, which also exports
 * the client-only `I18nProvider` / `useI18n`. When a client component imports
 * from the `index.tsx` barrel, Next tags that module as a client boundary; a
 * server component importing `translate` from the same barrel would then get a
 * stripped client-reference proxy (`translate is not a function`). Importing
 * the translator from this pure module avoids that cross-boundary hazard.
 *
 * Falls back to French (the source of truth) when a key is missing in the
 * target locale, and finally to the raw key.
 */
export function translate(locale: Locale, key: TranslationKey): string {
  return (
    DICTIONARIES[locale]?.[key] ??
    DICTIONARIES[DEFAULT_LOCALE]?.[key] ??
    (key as string)
  );
}
