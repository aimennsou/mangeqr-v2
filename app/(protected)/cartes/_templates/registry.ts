import type { MenuTemplate } from "./types";
import { ElegantTemplate } from "./ElegantTemplate";
import { ModerneTemplate } from "./ModerneTemplate";
import { ArdoiseTemplate } from "./ArdoiseTemplate";
import { BistroTemplate } from "./BistroTemplate";
import { ElegantDoreTemplate } from "./ElegantDoreTemplate";
import { TableauVertTemplate } from "./TableauVertTemplate";

// Registry of available physical-menu templates. Add new designs here.
export const MENU_TEMPLATES: MenuTemplate[] = [
  {
    id: "elegant",
    label: "Élégant",
    description: "Style classique, typographie serif, mise en page centrée.",
    Component: ElegantTemplate,
  },
  {
    id: "moderne",
    label: "Moderne",
    description: "Bandeau sombre, accents jaunes, deux colonnes.",
    Component: ModerneTemplate,
  },
  {
    id: "ardoise",
    label: "Ardoise",
    description: "Ambiance bistrot : fond ardoise, écriture craie, deux colonnes.",
    Component: ArdoiseTemplate,
  },
  {
    id: "bistro",
    label: "Bistro",
    description: "Papier crème, bandeau rouge, cadre doré rustique.",
    Component: BistroTemplate,
  },
  {
    id: "elegant-dore",
    label: "Élégant Doré",
    description: "Cadre filigrane doré, serif raffiné, petites capitales.",
    Component: ElegantDoreTemplate,
  },
  {
    id: "tableau-vert",
    label: "Tableau Vert",
    description: "Ardoise sombre, bandeaux verts pliés, en-tête script — style brasserie.",
    Component: TableauVertTemplate,
  },
];

export function getTemplateById(id: string): MenuTemplate {
  return MENU_TEMPLATES.find((t) => t.id === id) ?? MENU_TEMPLATES[0];
}
