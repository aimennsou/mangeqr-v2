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
// Feature flags.
// -----------------------------------------------------------------------------
/**
 * Marketing campaigns feature. Hidden from the nav and its page is guarded
 * (redirects) until we decide to ship it to production. Flip to `true` to
 * re-enable everywhere in one place.
 */
export const MARKETING_ENABLED = false;
