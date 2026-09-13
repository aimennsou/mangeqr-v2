/**
 * Maps a restaurant currency enum value (EURO | DOLLAR | DINAR) to its display
 * symbol. Single source of truth so the diner menu, categories page and physical
 * card templates never diverge.
 *
 * - EURO   -> "€"
 * - DOLLAR -> "$"
 * - DINAR  -> "DZD"
 *
 * Falls back to "€" for unknown/undefined values.
 */
export function currencySymbol(currency?: string | null): string {
  switch (currency) {
    case "EURO":
      return "€";
    case "DOLLAR":
      return "$";
    case "DINAR":
      return "DZD";
    default:
      return "€";
  }
}
