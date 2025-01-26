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
      mensuel: "10€",
      annuel: "100€", // Ajoutez un prix annuel si applicable
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
      "Assistance incluse",
    ],
    cta: "Contactez-nous",
  },
  {
    id: "pro",
    title: "Pro",
    price: {
      mensuel: "35€",
      annuel: "350€", // Ajoutez un prix annuel si applicable
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
      "Assistance incluse",
    ],
    cta: "Contactez-nous",
    popular: true, // Ajout de l'attribut "popular" pour le plan Pro
  },
  {
    id: "premium",
    title: "Premium",
    price: {
      mensuel: "49€",
      annuel: "490€", // Ajoutez un prix annuel si applicable
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
      "Assistance incluse",
    ],
    cta: "Contactez-nous",
    highlighted: true, // Ajout de l'attribut "highlighted" pour le plan Premium
  },
];