import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  Gauge,
  QrCode,
  LucideIcon,

  ShoppingCart,

  Store,
  Send,
  Menu,
  Palette,
  ShieldAlert,
 
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { MARKETING_ENABLED } from "@/config";



type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  /** i18n key; the rendering component translates this with `label` as fallback. */
  labelKey?: string;
  active: boolean;
  icon: LucideIcon 
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  /** i18n key for the group heading. */
  groupLabelKey?: string;
  menus: Menu[];
};

/** Workspace role used to gate owner-only navigation entries. */
export type WorkspaceNavRole = "OWNER" | "MEMBER";

/**
 * Nav hrefs that are OWNER-only (mangeqr-team, T9). MEMBERS act on the owner's
 * menus/categories/dishes but cannot manage restaurants, marketing campaigns or
 * the digital-menu appearance/QR, so those entries are hidden for them. This is
 * UX hiding only — the server routes remain authoritative (T5). Menus and
 * "Catégories & plats" stay visible to members.
 */
const OWNER_ONLY_HREFS = new Set<string>([
  "/restaurant",
  "/marketing",
  "/numerique",
]);

export function getMenuList(
  pathname: string,
  role: WorkspaceNavRole = "OWNER",
  appRole?: UserRole | null
): Group[] {
  const groups: Group[] = [
    {
      groupLabel: "Tableau de bord",
      groupLabelKey: "nav.group.dashboard",
      menus: [
        {
          href: "/performances",
          label: "Mes performances",
          labelKey: "nav.performances",
          active: pathname.includes("/performances"),
          icon: Gauge,
          submenus: []
        },
     
  
      ]
    },
    {
      groupLabel: "Mon activité",
      groupLabelKey: "nav.group.activity",
      menus: [

        {
          href: "/restaurant",
          label: "Mes restaurants",
          labelKey: "nav.restaurants",
          active: pathname.includes("/restaurant"),
          icon: Store,
          submenus: []
        }, 


        {
          href: "/menu",
          label: "Menus",
          labelKey: "nav.menus",
          active: pathname.includes("/menu"),
          icon: Menu,
          submenus: [
            
          ]
        },
        {
          href: "/categories",
          label: "Catégories & plats",
          labelKey: "nav.categories",
          active: pathname.includes("/categories"),
          icon: Palette,
          submenus: [
            
          ]
        },
        
  
      ]
    },


{
  groupLabel: "Ma clientèle",
  groupLabelKey: "nav.group.clientele",
  menus: [

    {
      href: "/reviews",
      label: "Avis clients",
      labelKey: "nav.reviews",
      active: pathname.includes("/reviews"),
      icon: Users,
      submenus: [
        
      ]
    },
    {
      href: "/marketing",
      label: "Campagne marketing",
      labelKey: "nav.marketing",
            active: pathname.includes("/marketing"),
      icon: Send,
      submenus: []
    },
  ]
},


{
  groupLabel: "Personalisations",
  groupLabelKey: "nav.group.personalization",
  menus: [

    {
      href: "/numerique",
      label: "Menu numérique",
      labelKey: "nav.numerique",
      active: pathname.includes("/numerique"),
      icon: QrCode,
      submenus: []
    },
    {
      href: "/cartes",
      label: "Menu physique",
      labelKey: "nav.cartes",
      active: pathname.includes("/cartes"),
      icon: SquarePen,
      submenus: []
    },
  ]
},

    {
      groupLabel: "Parametres",
      groupLabelKey: "nav.group.settings",
      menus: [

        {
          href: "/settings",
          label: "Mon compte",
          labelKey: "nav.account",
          active: pathname.includes("/settings"),
          icon: Settings,
          submenus: []
        }
      ]
    }
  ];

  // Super Admin console (superadmin, S6): visible ONLY to the SUPERADMIN app
  // role. UX hiding only — /superadmin is guarded by middleware + server-side.
  if (appRole === "SUPERADMIN") {
    groups.push({
      groupLabel: "Administration",
      groupLabelKey: "nav.group.administration",
      menus: [
        {
          href: "/superadmin",
          label: "Super Admin",
          labelKey: "nav.superadmin",
          active: pathname.includes("/superadmin"),
          icon: ShieldAlert,
          submenus: [],
        },
      ],
    });
  }

  // Hide feature-flagged entries not yet shipped (e.g. marketing campaigns).
  // UX hiding only — the pages are also guarded server-side.
  const hiddenHrefs = new Set<string>();
  if (!MARKETING_ENABLED) hiddenHrefs.add("/marketing");

  const applyHidden = (list: Group[]): Group[] =>
    list
      .map((group) => ({
        ...group,
        menus: group.menus.filter((menu) => !hiddenHrefs.has(menu.href)),
      }))
      .filter((group) => group.menus.length > 0);

  // For MEMBERS, drop owner-only entries and any group left empty as a result.
  if (role === "MEMBER") {
    return applyHidden(
      groups
        .map((group) => ({
          ...group,
          menus: group.menus.filter((menu) => !OWNER_ONLY_HREFS.has(menu.href)),
        }))
        .filter((group) => group.menus.length > 0)
    );
  }

  return applyHidden(groups);
}
