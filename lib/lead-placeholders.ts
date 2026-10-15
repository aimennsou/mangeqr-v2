/**
 * Illustrative placeholders for the lead-gen funnel menus (`/go/fr`, `/go/ar` →
 * `/m/<leadId>`).
 *
 * WHY
 * ---
 * The funnel deliberately asks an anonymous visitor for nothing but dish names,
 * prices and descriptions — making them upload photos before they have even seen
 * the product would kill the conversion. The consequence was that the preview
 * they are shown (and share, and print a QR for) rendered with no cover and no
 * dish images, so the thing meant to sell the product looked empty.
 *
 * WHY DOODLES AND NOT STOCK PHOTOS
 * --------------------------------
 * A photograph of a steak next to a dish named "Pizza" misrepresents what the
 * restaurant actually serves. Line art reads as "no photo yet" while still
 * filling the layout, so the keyword matching below only has to be roughly right
 * — a drawn bowl over "Chorba" is suggestive, never a claim.
 *
 * Applied at RENDER time in `app/m/[id]/page.tsx`, never written into
 * `LeadMenu.data`, so:
 *   - every existing lead menu gets richer with no backfill, and
 *   - converting a lead into a real account (`convertLead`) cannot carry
 *     placeholder art into a real restaurant's dishes.
 *
 * The files are plain `.svg` under `public/images/doodles/` (see the README
 * there for the drawing rules). `next/image` serves SVG as-is instead of running
 * it through the optimizer, so this needs no `images.dangerouslyAllowSVG` — which
 * matters, because that flag would also apply to owner-uploaded S3 images.
 */

const D = (name: string) => `/images/doodles/${name}.svg`;

/** Cloche + cutlery, sized for the wide cover slot. */
export const LEAD_COVER_PHOTO = D('cover');

const DOODLE = {
  bowl: D('bowl'),
  cake: D('cake'),
  cup: D('cup'),
  fish: D('fish'),
  grill: D('grill'),
  pasta: D('pasta'),
  plate: D('plate'),
  salad: D('salad'),
  slice: D('slice'),
} as const;

/**
 * Keyword → doodle, checked in order. Covers French, Arabic and English, because
 * the funnel runs at `/go/fr` and `/go/ar` and real menus mix them freely (an
 * Algerian card commonly lists "Chorba" beside "Pizza").
 *
 * Latin keywords must be written WITHOUT accents: the haystack is stripped of
 * combining marks before matching (see `normalize`), so "crème" would never hit.
 * The same normalization removes Arabic tashkeel.
 *
 * Order matters — specific before generic, so "chocolat" reaches the cake before
 * "dessert" does, and "poisson" is claimed by the fish before "plat" falls
 * through to the generic plate.
 */
const KEYWORD_DOODLES: { doodle: string; keywords: string[] }[] = [
  {
    doodle: DOODLE.cake,
    keywords: [
      'dessert', 'gateau', 'cake', 'chocolat', 'chocolate', 'fondant',
      'brownie', 'moelleux', 'tarte', 'pie', 'crepe', 'gaufre', 'waffle',
      'patisserie', 'tiramisu', 'cheesecake', 'beignet', 'creme', 'brulee',
      'flan', 'glace', 'ice cream', 'sorbet', 'mousse', 'yaourt', 'yogurt',
      'حلويات', 'حلوى', 'كيك', 'قاطو', 'شوكولا', 'كريب', 'تارت', 'مثلجات',
    ],
  },
  {
    doodle: DOODLE.cup,
    keywords: [
      'cafe', 'coffee', 'expresso', 'espresso', 'cappuccino', 'the', 'tea',
      'jus', 'juice', 'limonade', 'lemonade', 'soda', 'boisson', 'drink',
      'cocktail', 'smoothie', 'milkshake', 'eau', 'water', 'infusion',
      'قهوة', 'شاي', 'عصير', 'مشروب', 'ماء', 'مشروبات',
    ],
  },
  {
    doodle: DOODLE.fish,
    keywords: [
      'poisson', 'fish', 'saumon', 'salmon', 'thon', 'tuna', 'crevette',
      'shrimp', 'gambas', 'calamar', 'squid', 'seafood', 'fruits de mer',
      'sardine', 'dorade', 'merlan', 'loup',
      'سمك', 'سلمون', 'جمبري', 'قريدس', 'حوت', 'بحرية',
    ],
  },
  {
    doodle: DOODLE.grill,
    keywords: [
      'grill', 'grillade', 'brochette', 'kebab', 'chawarma', 'shawarma',
      'kefta', 'merguez', 'bbq', 'barbecue', 'rotisserie', 'mixte',
      'steak', 'entrecote', 'beef', 'boeuf', 'viande', 'meat', 'burger',
      'cheeseburger', 'escalope', 'poulet', 'chicken', 'agneau', 'lamb',
      'tajine', 'tagine', 'couscous',
      'مشوي', 'مشاوي', 'لحم', 'دجاج', 'كفتة', 'شاورما', 'برغر', 'طاجين',
      'كسكس', 'خروف',
    ],
  },
  {
    doodle: DOODLE.pasta,
    keywords: [
      'pasta', 'pates', 'spaghetti', 'penne', 'tagliatelle', 'lasagne',
      'lasagna', 'macaroni', 'noodle', 'nouille', 'ramen', 'risotto',
      'riz', 'rice', 'paella', 'gratin', 'rechta', 'trida',
      'معكرونة', 'مكرونة', 'نودل', 'رز', 'ارز', 'رشتة', 'لازانيا',
    ],
  },
  {
    doodle: DOODLE.slice,
    keywords: [
      'pizza', 'pizzeria', 'margherita', 'calzone', 'focaccia', 'bruschetta',
      'panini', 'sandwich', 'baguette', 'tacos', 'wrap', 'chapati', 'burrito',
      'mhadjeb', 'msemen', 'bourek', 'brik', 'samossa', 'feuillete', 'toast',
      'tartine', 'pain', 'bread', 'tomate', 'tomato',
      'بيتزا', 'ساندويتش', 'خبز', 'طماطم', 'بريك', 'بوراك', 'محاجب', 'مسمن',
      'طاكوس', 'شاباتي',
    ],
  },
  {
    doodle: DOODLE.bowl,
    keywords: [
      'soup', 'soupe', 'potage', 'veloute', 'bouillon', 'broth', 'chorba',
      'harira', 'hrira', 'consomme', 'minestrone', 'bissara',
      'شوربة', 'شربة', 'حريرة', 'بيصارة', 'حسوة',
    ],
  },
  {
    doodle: DOODLE.salad,
    keywords: [
      'salad', 'salade', 'cesar', 'caesar', 'taboule', 'tabbouleh', 'crudite',
      'legume', 'vegetable', 'veggie', 'vegetarien', 'vegetalien', 'vegan',
      'avocat', 'avocado', 'coleslaw', 'entree', 'starter', 'appetizer',
      'mezze', 'meze', 'hummus', 'houmous', 'zaalouk', 'chlada', 'fruit',
      'سلطة', 'خضر', 'مقبلات', 'حمص', 'تبولة', 'زعلوك', 'شلاضة', 'فواكه',
    ],
  },
];

/**
 * Deterministic fallback order for dishes no keyword matched.
 *
 * Index-based rather than random on purpose: the page is server-rendered with
 * `force-dynamic`, so a random pick would hand the same dish a different drawing
 * on every reload. Opening on the generic plate keeps a one-dish menu neutral.
 */
const FALLBACK_CYCLE: string[] = [
  DOODLE.plate,
  DOODLE.grill,
  DOODLE.pasta,
  DOODLE.salad,
  DOODLE.bowl,
  DOODLE.slice,
  DOODLE.fish,
  DOODLE.cake,
];

/**
 * Lowercase, strip combining marks (Latin accents and Arabic tashkeel) and
 * collapse whitespace, so "Crème Brûlée" matches "creme" and a multi-word
 * keyword like "fruits de mer" stays reachable.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064b-\u0652]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pick an illustrative doodle for one funnel dish.
 *
 * Signals are tried narrowest-first — dish name, then description, then category
 * name — so a "Pizza" filed under a category called "Desserts" still gets the
 * slice. Unmatched dishes fall back to `FALLBACK_CYCLE[index]`.
 */
export function leadDishPhoto({
  dishName,
  description,
  categoryName,
  index,
}: {
  dishName: string;
  description?: string | null;
  categoryName?: string | null;
  /** Stable position of the dish within the whole menu, for the fallback cycle. */
  index: number;
}): string {
  const haystacks = [dishName, description ?? '', categoryName ?? '']
    .map(normalize)
    .filter(Boolean);

  for (const haystack of haystacks) {
    for (const { doodle, keywords } of KEYWORD_DOODLES) {
      if (keywords.some((k) => haystack.includes(k))) return doodle;
    }
  }

  return FALLBACK_CYCLE[Math.abs(index) % FALLBACK_CYCLE.length];
}
