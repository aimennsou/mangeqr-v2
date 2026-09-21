export const PAYMENT_FREQUENCIES = ["mensuel", "annuel"];

export interface PricingTier {
  title: string;
  id: string;
  price: Record<string, number | string>;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  popular?: boolean;
}

export const TIERS: PricingTier[] = [
  {
    id: "starter",
    title: "Starter",
    price: {
      mensuel: "12€",
      annuel: "120€",
    },
    description: "Une solution idéale pour les petits établissements souhaitant démarrer leur digitalisation de manière simple et efficace.",
    features: [
      "1 restaurant",
      "7 menus",
      "Catégories illimitées",
      "Plats illimités",
      "Scans illimités",
      "QR code unique par restaurant",
      "Modification de la disponibilité des menus",
      "Modification de la disponibilité des plats",
      "Statistiques de performance et suivi",
      "Plats avec photos",
      "Synchronisation automatique",
      "+2€ par table pour la livraison des QR codes personnalisés menus",
      "Module gestion de commande sur place + livraison (+5€/mois) : plan de salle, vue cuisine & caisse (POS) avec impression de tickets",
      "Assistance incluse",
    ],
    cta: "Contactez-nous",
  },
  {
    id: "pro",
    title: "Pro",
    price: {
      mensuel: "24€",
      annuel: "240€",
    },
    description: "Une solution parfaite pour les établissements multi-sites cherchant une gestion centralisée et optimisée.",
    features: [
      "Jusqu'à 3 restaurants",
      "21 menus",
      "Catégories illimitées",
      "Plats illimités",
      "Scans illimités",
      "QR code unique par restaurant",
      "Modification de la disponibilité des menus",
      "Modification de la disponibilité des plats",
      "Statistiques de performance et suivi",
      "Plats avec photos",
      "Synchronisation automatique",
      "+2€ par table pour la livraison des QR codes personnalisés menus",
      "Module gestion de commande sur place + livraison (+5€/mois) : plan de salle, vue cuisine & caisse (POS) avec impression de tickets",
      "Assistance incluse",
    ],
    cta: "Contactez-nous",
    popular: true, // Ajout de l'attribut "popular" pour le plan Pro
  },
  {
    id: "premium",
    title: "Premium",
    price: {
      mensuel: "37€",
      annuel: "370€",
    },
    description: "Une solution complète et avancée pour les grandes structures multi-sites avec des équipes étendues.",
    features: [
      "Restaurants illimités",
      "Menus illimités",
      "Catégories illimitées",
      "Plats illimités",
      "Scans illimités",
      "QR code unique par restaurant",
      "Modification de la disponibilité des menus",
      "Modification de la disponibilité des plats",
      "Statistiques de performance et suivi",
      "Plats avec photos",
      "Synchronisation automatique",
      "Livraison des menus gratuite",
      "Suppression du logo",
      "Conception personnalisée de QR code",
      "Module gestion de commande sur place + livraison (+5€/mois) : plan de salle, vue cuisine & caisse (POS) avec impression de tickets",
      "Assistance incluse",
    ],
    cta: "Contactez-nous",
    highlighted: true, // Ajout de l'attribut "highlighted" pour le plan Premium
  },
];


// -----------------------------------------------------------------------------
// Physical QR-code design catalog (Menu numérique → "Commander un design").
// Restaurateurs browse these and place a production/print order. Previews are
// rendered with CSS (gradient + accents) so no image assets are required.
// -----------------------------------------------------------------------------
export type DesignShape = "poster" | "disc" | "sticker" | "menu-sheet";

export interface DesignProduct {
  id: string;
  name: string;
  description: string;
  /** Display price per unit, e.g. "à partir de 19€". */
  price: string;
  shape: DesignShape;
  /** Tailwind classes for the CSS preview background. */
  previewClass: string;
  /** Small accent emojis shown on the preview. */
  accents: string[];
}

export const DESIGN_PRODUCTS: DesignProduct[] = [
  {
    id: "elegant-poster",
    name: "Affiche Élégante",
    description:
      "Affiche verticale noir & or, idéale à poser sur le comptoir ou au mur. Finition premium.",
    price: "à partir de 24€",
    shape: "poster",
    previewClass:
      "bg-gradient-to-b from-neutral-900 to-black text-amber-200 border border-amber-300/40",
    accents: ["✦"],
  },
  {
    id: "wood-disc",
    name: "Disque en Bois Gravé",
    description:
      "Médaillon rond en bois véritable, QR code gravé au laser. Chaleureux et durable.",
    price: "à partir de 34€",
    shape: "disc",
    previewClass:
      "bg-gradient-to-br from-amber-100 to-amber-300 text-amber-900 border border-amber-700/40",
    accents: ["🍴", "🍷"],
  },
  {
    id: "table-sticker",
    name: "Sticker de Table",
    description:
      "Autocollant rouge résistant, à coller directement sur les tables. Pack économique.",
    price: "à partir de 12€",
    shape: "sticker",
    previewClass: "bg-red-600 text-white border border-red-700",
    accents: ["📱"],
  },
];

// -----------------------------------------------------------------------------
// Printed physical-menu catalog (Menu physique → "Commander l'impression").
// The restaurateur designs a printable menu on the cartes page, then orders a
// professionally printed run in one of these formats.
// -----------------------------------------------------------------------------
export const PHYSICAL_MENU_PRODUCTS: DesignProduct[] = [
  {
    id: "printed-menu-a4",
    name: "Menu imprimé A4",
    description:
      "Impression professionnelle de votre carte au format A4, papier premium mat ou brillant.",
    price: "à partir de 1,50€ / exemplaire",
    shape: "menu-sheet",
    previewClass:
      "bg-white text-neutral-800 border border-neutral-300",
    accents: ["📄"],
  },
  {
    id: "laminated-menu",
    name: "Menu plastifié",
    description:
      "Carte plastifiée résistante à l'eau et aux taches, idéale pour un usage quotidien en salle.",
    price: "à partir de 3€ / exemplaire",
    shape: "menu-sheet",
    previewClass:
      "bg-gradient-to-br from-sky-50 to-sky-100 text-sky-900 border border-sky-300",
    accents: ["💧", "📄"],
  },
  {
    id: "menu-booklet",
    name: "Menu livret",
    description:
      "Livret relié plusieurs pages pour les cartes complètes (entrées, plats, vins, desserts).",
    price: "à partir de 5€ / exemplaire",
    shape: "menu-sheet",
    previewClass:
      "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900 border border-amber-300",
    accents: ["📖"],
  },
];

/** Look up a product across BOTH catalogs (QR designs + printed menus). */
export function getDesignProduct(id: string): DesignProduct | undefined {
  return (
    DESIGN_PRODUCTS.find((d) => d.id === id) ??
    PHYSICAL_MENU_PRODUCTS.find((d) => d.id === id)
  );
}

// -----------------------------------------------------------------------------
// Currency-aware pricing for the design + printed-menu catalogs.
//
// Prices must follow the restaurant currency (EURO | DOLLAR | DINAR) instead of
// always showing euros. These are PLACEHOLDER amounts until final pricing is
// provided; keep the numbers here as the single source of truth and swap them
// when the definitive prices arrive.
//
// The `unit` flag distinguishes per-piece prices (QR supports, ordered as a
// single object) from per-copy prices (printed menus, ordered in runs).
// -----------------------------------------------------------------------------
type PriceCurrency = 'EURO' | 'DOLLAR' | 'DINAR';

interface ProductPricing {
  /** Base amount per currency (placeholder values). */
  amount: Record<PriceCurrency, number>;
  /** Whether the price is per printed copy (menus) or per piece (QR supports). */
  unit: 'piece' | 'copy';
}

/** Placeholder base prices per product id and currency. */
const DESIGN_PRICING: Record<string, ProductPricing> = {
  // QR-code supports (per piece). DZD floor is 150 DZD (cheapest support).
  'elegant-poster': { amount: { EURO: 24, DOLLAR: 26, DINAR: 300 }, unit: 'piece' },
  'wood-disc': { amount: { EURO: 34, DOLLAR: 37, DINAR: 450 }, unit: 'piece' },
  'table-sticker': { amount: { EURO: 12, DOLLAR: 13, DINAR: 150 }, unit: 'piece' },
  // Printed physical menus (per copy).
  'printed-menu-a4': { amount: { EURO: 1.5, DOLLAR: 1.7, DINAR: 220 }, unit: 'copy' },
  'laminated-menu': { amount: { EURO: 3, DOLLAR: 3.3, DINAR: 450 }, unit: 'copy' },
  'menu-booklet': { amount: { EURO: 5, DOLLAR: 5.5, DINAR: 750 }, unit: 'copy' },
};

function normalizeCurrency(currency?: string | null): PriceCurrency {
  return currency === 'DOLLAR' || currency === 'DINAR' ? currency : 'EURO';
}

/** Format an amount with the correct symbol and placement for the currency. */
function formatMoney(amount: number, currency: PriceCurrency): string {
  if (currency === 'DINAR') {
    // Whole dinars, symbol after: "3500 DZD".
    return `${Math.round(amount)} DZD`;
  }
  const symbol = currency === 'DOLLAR' ? '$' : '€';
  // Keep decimals only when needed (e.g. "1,50€" vs "24€").
  const hasDecimals = Math.round(amount) !== amount;
  const value = hasDecimals
    ? amount.toFixed(2).replace('.', ',')
    : String(amount);
  return `${value}${symbol}`;
}

/**
 * Localized display price for a design / printed-menu product, following the
 * given restaurant currency. Returns a string like "à partir de 24€",
 * "à partir de 3500 DZD" or "à partir de 1,50€ / exemplaire".
 *
 * Falls back to the product's static `price` string when the id is unknown.
 */
export function getDesignPrice(
  productId: string,
  currency?: string | null,
): string {
  const pricing = DESIGN_PRICING[productId];
  if (!pricing) {
    return getDesignProduct(productId)?.price ?? '';
  }
  const cur = normalizeCurrency(currency);
  const money = formatMoney(pricing.amount[cur], cur);
  return pricing.unit === 'copy'
    ? `à partir de ${money} / exemplaire`
    : `à partir de ${money}`;
}


// -----------------------------------------------------------------------------
// Delivery options for design / printed-menu orders.
// The available options depend on the restaurant's country, which we infer from
// its currency: DINAR => Algeria. In Algeria the ONLY option is Yalidine bureau.
// -----------------------------------------------------------------------------
export interface DeliveryOption {
  id: string;
  label: string;
  /** Human-readable price, e.g. "400 DZD" or "Offert". */
  price: string;
}

const ALGERIA_DELIVERY: DeliveryOption[] = [
  { id: "yalidine-bureau", label: "Yalidine bureau", price: "400 DZD" },
];

const DEFAULT_DELIVERY: DeliveryOption[] = [
  { id: "standard", label: "Livraison standard", price: "Offert" },
  { id: "express", label: "Livraison express", price: "+15€" },
  { id: "pickup", label: "Retrait en point relais", price: "Offert" },
];

/** True when the restaurant currency indicates Algeria (Algerian Dinar). */
export function isAlgerianCurrency(currency?: string | null): boolean {
  return currency === "DINAR";
}

/**
 * Delivery options available for a restaurant, based on its currency.
 * Algeria (DINAR) is restricted to Yalidine bureau only.
 */
export function getDeliveryOptions(currency?: string | null): DeliveryOption[] {
  return isAlgerianCurrency(currency) ? ALGERIA_DELIVERY : DEFAULT_DELIVERY;
}

export function getDeliveryOption(id: string): DeliveryOption | undefined {
  return [...ALGERIA_DELIVERY, ...DEFAULT_DELIVERY].find((o) => o.id === id);
}


// -----------------------------------------------------------------------------
// Landing pricing by region (France = EUR, Algérie = DZD).
// The public pricing section lets the visitor pick their region; prices switch
// between euros and Algerian dinars. PLACEHOLDER DZD amounts until finals are
// given — keep them here as the single source of truth.
// -----------------------------------------------------------------------------
export type PricingRegion = "france" | "algerie";

export interface RegionPricing {
  /** Currency symbol/placement handled per region in the labels below. */
  symbol: string;
  /** Per-tier displayed price by frequency, e.g. { starter: { mensuel, annuel } }. */
  tiers: Record<string, Record<string, string>>;
  /**
   * Optional per-tier ANNUAL price when the ordering module is bundled in
   * (Algeria packages a discounted annual + module bundle). Shown as a small
   * secondary line under the annual price. Keyed by tier id.
   */
  tiersAnnualWithModule?: Record<string, string>;
  /** Delivery surcharge per table for personalized QR menus (Starter/Pro line). */
  perTableDelivery: string;
  /** Ordering add-on monthly price shown on every card. */
  orderingAddon: string;
  /** QR-design ordering floor price shown as a note (e.g. "à partir de 150 DZD"). */
  qrDesignFrom?: string;
}

export const REGION_LABELS: Record<PricingRegion, string> = {
  france: "France",
  algerie: "Algérie",
};

export const REGION_PRICING: Record<PricingRegion, RegionPricing> = {
  france: {
    symbol: "€",
    tiers: {
      starter: { mensuel: "12€", annuel: "120€" },
      pro: { mensuel: "24€", annuel: "240€" },
      premium: { mensuel: "37€", annuel: "370€" },
    },
    perTableDelivery: "+2€",
    orderingAddon: "+5€/mois",
  },
  algerie: {
    symbol: "DZD",
    tiers: {
      starter: { mensuel: "2500 DZD", annuel: "30000 DZD" },
      pro: { mensuel: "3500 DZD", annuel: "40000 DZD" },
      premium: { mensuel: "5200 DZD", annuel: "60000 DZD" },
    },
    // Annual price when the ordering module is bundled in.
    tiersAnnualWithModule: {
      starter: "35000 DZD",
      pro: "50000 DZD",
      premium: "70000 DZD",
    },
    perTableDelivery: "+300 DZD",
    orderingAddon: "+700 DZD/mois",
    qrDesignFrom: "à partir de 150 DZD par design",
  },
};

/** Displayed tier price for a region + frequency (falls back to config TIERS). */
export function getRegionTierPrice(
  region: PricingRegion,
  tierId: string,
  frequency: string,
): string {
  return (
    REGION_PRICING[region]?.tiers[tierId]?.[frequency] ??
    (TIERS.find((t) => t.id === tierId)?.price[frequency] as string) ??
    ""
  );
}

// -----------------------------------------------------------------------------
// Plan pricing per currency (#2). EUR is the online (Stripe) price; DZD is the
// cash/offline price shown to Algerian accounts, who request an upgrade the
// back-office fulfills manually. PLACEHOLDER DZD amounts until finals are given.
// -----------------------------------------------------------------------------
// STARTER is included for the CASH (espèces) upgrade-request flow, where the
// back-office grants it manually. It has NO Stripe price (see lib/stripe.ts),
// so it is never offered through the online checkout.
export type PaidPlanId = 'STARTER' | 'PRO' | 'PREMIUM';
export type PlanBillingFrequency = 'mensuel' | 'annuel';

interface PlanAmount {
  EUR: number;
  DZD: number;
}

const PLAN_PRICING: Record<PaidPlanId, Record<PlanBillingFrequency, PlanAmount>> = {
  STARTER: {
    mensuel: { EUR: 19, DZD: 2500 },
    annuel: { EUR: 190, DZD: 30000 },
  },
  PRO: {
    mensuel: { EUR: 35, DZD: 5000 },
    annuel: { EUR: 350, DZD: 50000 },
  },
  PREMIUM: {
    mensuel: { EUR: 49, DZD: 7000 },
    annuel: { EUR: 490, DZD: 70000 },
  },
};

/**
 * Localized plan price label following the account currency.
 * - DINAR  → "5000 DZD / mois"
 * - others → "35 € / mois"
 */
export function getPlanPriceLabel(
  plan: PaidPlanId,
  frequency: PlanBillingFrequency,
  currency?: string | null,
): string {
  const amounts = PLAN_PRICING[plan][frequency];
  const period = frequency === 'annuel' ? '/ an' : '/ mois';
  if (currency === 'DINAR') {
    return `${amounts.DZD} DZD ${period}`;
  }
  return `${amounts.EUR} € ${period}`;
}

// -----------------------------------------------------------------------------
// Feature flags.
// -----------------------------------------------------------------------------
/**
 * Marketing campaigns feature. Hidden from the nav and its page is guarded
 * (redirects) until we decide to ship it to production. Flip to `true` to
 * re-enable everywhere in one place.
 */
export const MARKETING_ENABLED = false;
