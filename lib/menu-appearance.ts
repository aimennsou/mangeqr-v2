import type { MenuAppearance } from '@/schemas';

/**
 * Shared diner-menu appearance helpers (Requirement 4).
 *
 * These live in a neutral `lib/` module so BOTH the protected editor/preview
 * (D.3/D.4, under app/(protected)/numerique/_components) and the public diner
 * menu (D.5, under app/restaurant/[id]/_components) can consume the exact same
 * field→style mapping without the public component importing owner-app code
 * across route-group boundaries.
 */

/**
 * Default diner-menu appearance (Requirement 4.4): applied whenever the owner
 * has not customized a restaurant's look. The editor pre-fills the form with
 * these values when `menuAppearance` is unset, and the diner menu (D.5) falls
 * back to the same defaults. Keeping them in one place lets the editor, the
 * preview (D.4) and the public menu (D.5) stay in sync.
 */
export const DEFAULT_MENU_APPEARANCE: Required<MenuAppearance> = {
  fontFamily: 'Inter',
  primaryColor: '#111827',
  backgroundColor: '#FFFFFF',
  showAddress: true,
  showPhone: true,
  showWifi: true,
  showWebsite: true,
  showInstagram: true,
  showTiktok: true,
  showGoogle: true,
};

/**
 * Small curated font list offered in the editor. Values are plain family names
 * so the diner menu can apply them via `font-family` without extra loading.
 */
export const MENU_FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Inter', label: 'Inter (moderne)' },
  { value: 'Poppins', label: 'Poppins (arrondi)' },
  { value: 'Montserrat', label: 'Montserrat (élégant)' },
  { value: 'Playfair Display', label: 'Playfair Display (raffiné)' },
  { value: 'Lato', label: 'Lato (sobre)' },
  { value: 'Georgia', label: 'Georgia (classique)' },
];

/**
 * Merge a stored (possibly partial / null) appearance with the defaults so the
 * form always starts from a fully-populated, valid state.
 */
export function withAppearanceDefaults(
  appearance: MenuAppearance | null | undefined
): Required<MenuAppearance> {
  return { ...DEFAULT_MENU_APPEARANCE, ...(appearance ?? {}) };
}

/**
 * Map an appearance to the inline styles that skin a menu surface. Shared so
 * the D.4 preview and the D.5 diner menu apply the same field→style mapping
 * instead of each re-deriving it. Falls back through the defaults first.
 */
export function appearanceStyles(
  appearance: MenuAppearance | null | undefined
): {
  screen: { backgroundColor: string; fontFamily: string };
  accent: { color: string };
} {
  const resolved = withAppearanceDefaults(appearance);
  // Quote the family and append a generic fallback so unknown/uninstalled
  // fonts degrade gracefully without any font-loading infrastructure.
  const fontFamily = `"${resolved.fontFamily}", system-ui, sans-serif`;

  return {
    screen: {
      backgroundColor: resolved.backgroundColor,
      fontFamily,
    },
    accent: { color: resolved.primaryColor },
  };
}

/* -------------------------------------------------------------------------- */
/* Dependency-free color math (BUG-7)                                          */
/*                                                                             */
/* The diner menu must render EXACTLY as the owner configured it, IDENTICALLY  */
/* on every device and INDEPENDENT of the diner's device dark/light theme.     */
/* To do that we derive a full, self-consistent palette from the owner's       */
/* backgroundColor (+ primaryColor accent) instead of leaning on app theme     */
/* tokens (text-muted-foreground, bg-muted, ...) that flip with the diner's    */
/* OS/browser theme. All helpers below are pure and dependency-free.           */
/* -------------------------------------------------------------------------- */

/** Parsed RGB channels, each 0–255. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a hex color (`#RGB`, `#RRGGBB`, or the same without the leading `#`)
 * into 0–255 channels. Unparseable input falls back to opaque black so callers
 * always receive a usable value.
 */
export function hexToRgb(hex: string): Rgb {
  const clean = hex.trim().replace(/^#/, '');

  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (![r, g, b].some(Number.isNaN)) return { r, g, b };
  }

  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (![r, g, b].some(Number.isNaN)) return { r, g, b };
  }

  return { r: 0, g: 0, b: 0 };
}

/**
 * Perceived (Rec. 709) luminance of a hex color on the 0–255 scale. Used to
 * decide whether a surface is "dark" so we can pick contrasting text.
 */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Threshold below which a background is treated as dark. */
const DARK_BG_THRESHOLD = 140;

/** True when the given hex background reads as "dark". */
export function isDarkColor(hex: string): boolean {
  return luminance(hex) < DARK_BG_THRESHOLD;
}

/** Build an `rgba(...)` string from a hex color and an alpha (0–1). */
export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Linearly mix two hex colors. `t` is the weight of `hexB` (0 → all `hexA`,
 * 1 → all `hexB`). Returns an opaque `rgb(...)` string.
 */
export function mix(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const clamp = Math.min(1, Math.max(0, t));
  const r = Math.round(a.r + (b.r - a.r) * clamp);
  const g = Math.round(a.g + (b.g - a.g) * clamp);
  const bl = Math.round(a.b + (b.b - a.b) * clamp);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Near-black / near-white body text anchors used to build the palette. */
const NEAR_BLACK = '#111827';
const NEAR_WHITE = '#F9FAFB';

/**
 * Pick a text color (near-black or near-white) that reads on top of `bgHex`.
 * Used both for body text over the menu background and for label text over the
 * accent color (active tab, primary buttons).
 */
export function readableTextOn(bgHex: string): string {
  return isDarkColor(bgHex) ? NEAR_WHITE : NEAR_BLACK;
}

/**
 * A full, self-consistent diner-menu palette derived purely from the owner's
 * appearance (BUG-7). Every field is a plain CSS color string so components can
 * apply it via inline `style`, keeping the menu independent of the diner's
 * device theme.
 */
export interface AppearanceTheme {
  /** The resolved owner background (also `screen.backgroundColor`). */
  background: string;
  /** Primary body text — near-black on light bg, near-white on dark bg. */
  text: string;
  /** Secondary text — `text` at reduced alpha so it always contrasts. */
  muted: string;
  /** Divider / card border — a low-alpha version of `text`. */
  border: string;
  /** Subtle raised panel (chips, dish cards, review box, tab bar, placeholders). */
  surface: string;
  /** Owner primary color, reused for headings / price / active affordances. */
  accent: string;
  /** Readable label color to place ON the accent (active tab, buttons). */
  onAccent: string;
}

/**
 * Derive the {@link AppearanceTheme} from an owner appearance. Additive to
 * {@link appearanceStyles}: the diner menu (D.5) and editor preview (D.4) both
 * call this to skin every surface from the owner's colors alone.
 */
export function appearanceTheme(
  appearance: MenuAppearance | null | undefined
): AppearanceTheme {
  const resolved = withAppearanceDefaults(appearance);
  const background = resolved.backgroundColor;
  const accent = resolved.primaryColor;

  // Body text anchored to whichever of near-black/near-white contrasts on bg.
  const text = readableTextOn(background);

  return {
    background,
    text,
    // Secondary text as translucent `text` → always contrasts on the bg.
    muted: rgba(text, 0.65),
    // Dividers/cards: faint `text` so they show on any bg.
    border: rgba(text, 0.15),
    // Raised panel: nudge the bg ~8% toward the text color for a subtle tint.
    surface: mix(background, text, 0.08),
    accent,
    // Label color for text placed on top of the accent (active tab / buttons).
    onAccent: readableTextOn(accent),
  };
}
