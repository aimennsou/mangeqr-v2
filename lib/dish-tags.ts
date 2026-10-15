import type { TranslationKey } from '@/lib/i18n/dictionaries';

/**
 * The two kinds of thing an owner can mark on a dish, and the single source of
 * truth for how they are classified.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * A dish carries ONE flat array in the database, `Dish.allergenes: String[]`,
 * but the diner card renders it as two visually different things:
 *
 *   - CONTAINS  → a plain "Contient : Lait, Blé" row (regulated allergens)
 *   - TAGS      → coloured badges with icons (Végétarien, Fait maison, …)
 *
 * The split was decided by a `DIET_TAG_MAP` that lived privately inside
 * `PublicMenu.tsx`, while the owner form kept its own unrelated, hardcoded list
 * of nine toggles under one label, "Allergènes & tags". Two consequences:
 *
 *   1. The form mixed the two concepts, so an owner could not tell which toggle
 *      produced a badge and which produced a "Contient" entry.
 *   2. The two lists had already drifted. `Fait maison` and `De saison` are
 *      rendered as badges by the card and used by the seed, but the form offered
 *      no way to set them — they were unreachable in the product.
 *
 * So both the form options AND the classification now come from here. Adding a
 * value means editing one list, and the card picks it up for free.
 *
 * STORED VALUES ARE FROZEN STRINGS
 * --------------------------------
 * `value` is what lands in the database and is already present in live rows, the
 * seed and the duplicate endpoints. Never rename one — translate the `labelKey`
 * instead. Note `Vegetarian` is stored in English while its neighbours are
 * French; that is pre-existing data, not a mistake to "fix".
 */

export interface DishTagOption {
  /** Literal value persisted in `Dish.allergenes`. Do not change. */
  value: string;
  labelKey: TranslationKey;
  /** Kept in the UI next to the label — purely decorative. */
  emoji: string;
}

/**
 * "Contient" group — what the dish actually contains. These render in the plain
 * allergen row on the diner card.
 *
 * The first seven were the ones the form already offered. The rest complete the
 * common EU-14 set; `Gluten`, `Sulfites`, `Céleri` and `Moutarde` in particular
 * were already used as example values in the landing-page mockups but could not
 * be selected on a real dish.
 */
export const ALLERGEN_OPTIONS: DishTagOption[] = [
  { value: 'Arachides', labelKey: 'allergens.Arachides', emoji: '🥜' },
  { value: 'Fruits à coque', labelKey: 'allergens.Fruits à coque', emoji: '🌰' },
  { value: 'Lait', labelKey: 'allergens.Lait', emoji: '🥛' },
  { value: 'Œufs', labelKey: 'allergens.Œufs', emoji: '🥚' },
  { value: 'Blé', labelKey: 'allergens.Blé', emoji: '🌾' },
  { value: 'Soja', labelKey: 'allergens.Soja', emoji: '🫘' },
  { value: 'Poisson', labelKey: 'allergens.Poisson', emoji: '🐟' },
  { value: 'Crustacés', labelKey: 'allergens.Crustacés', emoji: '🦐' },
  { value: 'Gluten', labelKey: 'allergens.Gluten', emoji: '🍞' },
  { value: 'Sésame', labelKey: 'allergens.Sésame', emoji: '🌱' },
  { value: 'Moutarde', labelKey: 'allergens.Moutarde', emoji: '🌭' },
  { value: 'Céleri', labelKey: 'allergens.Céleri', emoji: '🥬' },
  { value: 'Sulfites', labelKey: 'allergens.Sulfites', emoji: '🍷' },
];

/**
 * Tag group — dietary and quality claims about the dish. These render as
 * coloured badges, NOT as something the dish "contains": "Contient :
 * Végétarien" would be nonsense, which is the whole reason for the split.
 *
 * Every value here must also resolve through `DIET_TAG_MAP` below, or the card
 * would silently demote it into the allergen row.
 */
export const DIET_TAG_OPTIONS: DishTagOption[] = [
  { value: 'Vegetarian', labelKey: 'diner.tag.vegetarian', emoji: '🥦' },
  { value: 'Piquant', labelKey: 'diner.tag.spicy', emoji: '🌶️' },
  { value: 'Fait maison', labelKey: 'diner.tag.homemade', emoji: '👨‍🍳' },
  { value: 'De saison', labelKey: 'diner.tag.seasonal', emoji: '🍂' },
];

export type DietTagVariant = 'veg' | 'home' | 'spicy' | 'season';

export type DietTag = {
  key: TranslationKey;
  variant: DietTagVariant;
};

/**
 * Lookup from a stored value to a badge descriptor, keyed by the LOWERCASED
 * value.
 *
 * Deliberately wider than `DIET_TAG_OPTIONS`: it also accepts spellings that
 * never came from the current form — English (`homemade`, `spicy`, `seasonal`)
 * and accented French (`végétarien`, `épicé`) — because older rows, imports and
 * the seed contain them. Dropping those aliases would silently move existing
 * badges into the "Contient" row.
 *
 * Only `.toLowerCase()` is applied, not accent stripping, so accented spellings
 * need their own entry.
 */
export const DIET_TAG_MAP: Record<string, DietTag> = {
  vegetarian: { key: 'diner.tag.vegetarian', variant: 'veg' },
  végétarien: { key: 'diner.tag.vegetarian', variant: 'veg' },
  vegetarien: { key: 'diner.tag.vegetarian', variant: 'veg' },
  'fait maison': { key: 'diner.tag.homemade', variant: 'home' },
  homemade: { key: 'diner.tag.homemade', variant: 'home' },
  piquant: { key: 'diner.tag.spicy', variant: 'spicy' },
  épicé: { key: 'diner.tag.spicy', variant: 'spicy' },
  epice: { key: 'diner.tag.spicy', variant: 'spicy' },
  spicy: { key: 'diner.tag.spicy', variant: 'spicy' },
  'de saison': { key: 'diner.tag.seasonal', variant: 'season' },
  seasonal: { key: 'diner.tag.seasonal', variant: 'season' },
};

/**
 * Split a dish's stored array into badges and allergen chips.
 *
 * Anything not recognised as a diet tag is treated as an allergen and shown
 * verbatim. That fallback is intentional: owners can end up with values this
 * module has never heard of (older data, duplicated dishes), and showing an
 * unknown term under "Contient" is the safe failure — hiding it could withhold
 * allergen information from a diner.
 */
export function splitAllergenes(allergenes: string[]): {
  tags: DietTag[];
  contains: string[];
} {
  const tags: DietTag[] = [];
  const contains: string[] = [];
  for (const raw of allergenes) {
    const tag = DIET_TAG_MAP[raw.trim().toLowerCase()];
    if (tag) tags.push(tag);
    else contains.push(raw);
  }
  return { tags, contains };
}

/** True when the stored value is a diet/quality tag rather than an allergen. */
export function isDietTag(value: string): boolean {
  return value.trim().toLowerCase() in DIET_TAG_MAP;
}

/**
 * Map an alias spelling onto the value the form's toggle actually carries, e.g.
 * `Végétarien` → `Vegetarian`.
 *
 * Without this, a dish stored with an alias showed its badge on the diner card
 * while the matching toggle sat unselected in the edit form — and ticking it
 * would have added the canonical value ALONGSIDE the alias, rendering the badge
 * twice.
 */
function canonicalDietTagValue(raw: string): string | null {
  const tag = DIET_TAG_MAP[raw.trim().toLowerCase()];
  if (!tag) return null;
  return (
    DIET_TAG_OPTIONS.find((o) => o.labelKey === tag.key)?.value ?? null
  );
}

const ALLERGEN_VALUES = new Set(ALLERGEN_OPTIONS.map((o) => o.value));

/**
 * Prepare a stored array for the two-group form.
 *
 * `allergens` and `dietTags` hold ONLY values the form can actually render as a
 * selected toggle, canonicalised and de-duplicated. Everything else goes to
 * `extras`.
 *
 * `extras` is the important part. A Radix ToggleGroup reports back only the
 * values of the items it renders, so feeding it a value with no matching item
 * means the first click the owner makes silently deletes that value. Dishes do
 * carry such values — older rows, imports, duplicated dishes — and quietly
 * dropping one could remove allergen information from a live menu. Holding them
 * aside and re-appending on save makes an edit non-destructive.
 */
export function splitDishTags(allergenes: string[] | null | undefined): {
  allergens: string[];
  dietTags: string[];
  extras: string[];
} {
  const allergens: string[] = [];
  const dietTags: string[] = [];
  const extras: string[] = [];

  for (const raw of allergenes ?? []) {
    const canonicalTag = canonicalDietTagValue(raw);
    if (canonicalTag) {
      if (!dietTags.includes(canonicalTag)) dietTags.push(canonicalTag);
    } else if (ALLERGEN_VALUES.has(raw)) {
      if (!allergens.includes(raw)) allergens.push(raw);
    } else if (!extras.includes(raw)) {
      extras.push(raw);
    }
  }

  return { allergens, dietTags, extras };
}

/**
 * Recombine the form's two groups (plus anything `splitDishTags` set aside) into
 * the single array the API stores.
 *
 * Allergens first, matching the reading order on the diner card.
 */
export function mergeDishTags(
  allergens: string[],
  dietTags: string[],
  extras: string[] = []
): string[] {
  return [...allergens, ...extras, ...dietTags];
}
