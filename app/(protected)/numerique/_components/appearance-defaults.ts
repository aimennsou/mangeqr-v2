/**
 * The diner-menu appearance helpers were relocated to a neutral `lib/` module
 * (`@/lib/menu-appearance`) so the public diner menu (D.5) can share the exact
 * same field→style mapping without importing across route-group boundaries.
 *
 * This barrel re-exports them so the existing D.3/D.4 editor/preview imports
 * (`./appearance-defaults`) keep working unchanged.
 */
export {
  DEFAULT_MENU_APPEARANCE,
  MENU_FONT_OPTIONS,
  withAppearanceDefaults,
  appearanceStyles,
} from '@/lib/menu-appearance';
