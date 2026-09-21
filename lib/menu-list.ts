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
  Package,
  MessageSquare,
  Sparkles,
  UtensilsCrossed,
  LayoutDashboard,
  CreditCard,
  FileText,
 
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import { MARKETING_ENABLED } from "@/config";
import {
  PERMISSION_HREFS,
  DEFAULT_MEMBER_PERMISSIONS,
  type MemberPermission,
} from "@/lib/permissions";



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
  // Managing the floor plan is a restaurant-structure action (FEAT-2). Members
  // can take/manage orders and use the kitchen board, but not edit tables.
  "/tables",
]);

export function getMenuList(
  pathname: string,
  role: WorkspaceNavRole = "OWNER",
  appRole?: UserRole | null,
  orderingEnabled: boolean = false,
  /** MEMBER granular permissions; null/undefined => all (owner or default). */
  memberPermissions?: MemberPermission[] | null
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

  // Ordering (FEAT-1/FEAT-2): the "Prise de commande" group is shown ONLY when
  // the account has ordering enabled (superadmin-gated, resolved client-side via
  // useOrderingEnabled → /api/team/context). UX hiding only — the pages and
  // order/table routes remain guarded server-side. Members see it too so staff
  // can take orders and use the kitchen board (D6).
  if (orderingEnabled) {
    // Insert just before the "Parametres" group so ordering sits with the
    // operational sections.
    const settingsIdx = groups.findIndex(
      (gGroup) => gGroup.groupLabelKey === "nav.group.settings"
    );
    const orderingGroup: Group = {
      groupLabel: "Prise de commande",
      groupLabelKey: "nav.group.ordering",
      menus: [
        {
          href: "/commandes",
          label: "Commandes",
          labelKey: "nav.orders",
          active: pathname.includes("/commandes"),
          icon: ShoppingCart,
          submenus: [],
        },
        {
          href: "/cuisine",
          label: "Cuisine",
          labelKey: "nav.kitchen",
          active: pathname.includes("/cuisine"),
          icon: UtensilsCrossed,
          submenus: [],
        },
        {
          href: "/tables",
          label: "Plan de salle",
          labelKey: "nav.tables",
          active: pathname.includes("/tables"),
          icon: LayoutDashboard,
          // Owner-only: managing the floor plan is a restaurant-structure action.
          submenus: [],
        },
      ],
    };
    if (settingsIdx >= 0) {
      groups.splice(settingsIdx, 0, orderingGroup);
    } else {
      groups.push(orderingGroup);
    }
  }

  // Super Admin console (superadmin, S6): visible ONLY to the SUPERADMIN app
  // role. UX hiding only — /superadmin is guarded by middleware + server-side.
  if (appRole === "SUPERADMIN") {
    groups.push({
      groupLabel: "Administration",
      groupLabelKey: "nav.group.administration",
      menus: [
        {
          href: "/superadmin",
          // Exact match so this entry isn't also marked active on the nested
          // /superadmin/design-orders route (which has its own entry).
          label: "Super Admin",
          labelKey: "nav.superadmin",
          active:
            pathname === "/superadmin" || pathname === "/superadmin/",
          icon: ShieldAlert,
          submenus: [],
        },
        {
          href: "/superadmin/users",
          label: "Utilisateurs",
          labelKey: "nav.superadmin.users",
          active: pathname.includes("/superadmin/users"),
          icon: Users,
          submenus: [],
        },
        {
          href: "/superadmin/restaurants",
          label: "Restaurants",
          labelKey: "nav.superadmin.restaurants",
          active: pathname.includes("/superadmin/restaurants"),
          icon: Store,
          submenus: [],
        },
        {
          href: "/superadmin/design-orders",
          label: "Commandes de designs",
          labelKey: "nav.superadmin.designOrders",
          active: pathname.includes("/superadmin/design-orders"),
          icon: Package,
          submenus: [],
        },
        {
          href: "/superadmin/leads",
          label: "Leads",
          labelKey: "nav.superadmin.leads",
          active: pathname.includes("/superadmin/leads"),
          icon: Sparkles,
          submenus: [],
        },
        {
          href: "/superadmin/upgrades",
          label: "Demandes de forfait",
          labelKey: "nav.superadmin.upgrades",
          active: pathname.includes("/superadmin/upgrades"),
          icon: CreditCard,
          submenus: [],
        },
        {
          href: "/superadmin/devis",
          label: "Demandes de devis",
          labelKey: "nav.superadmin.devis",
          active: pathname.includes("/superadmin/devis"),
          icon: FileText,
          submenus: [],
        },
        {
          href: "/superadmin/support",
          label: "Messages",
          labelKey: "nav.superadmin.support",
          active: pathname.includes("/superadmin/support"),
          icon: MessageSquare,
          submenus: [],
        },
      ],
    });
  }

  // STAFF (#11): back-office follow-up team. They only get the leads CRM — a
  // single Administration entry. Routes stay guarded server-side.
  if (appRole === "STAFF") {
    groups.push({
      groupLabel: "Administration",
      groupLabelKey: "nav.group.administration",
      menus: [
        {
          href: "/superadmin/leads",
          label: "Leads",
          labelKey: "nav.superadmin.leads",
          active: pathname.includes("/superadmin/leads"),
          icon: Sparkles,
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

  // SUPERADMIN accounts are platform operators, not restaurateurs: they only
  // use the Administration console, so hide all the owner-facing groups
  // (dashboard, activity, clientele, personnalisations, settings) and show just
  // the Administration group. UX only — routes stay guarded server-side.
  if (appRole === "SUPERADMIN" || appRole === "STAFF") {
    return applyHidden(
      groups.filter(
        (group) => group.groupLabelKey === "nav.group.administration"
      )
    );
  }

  // For MEMBERS, drop owner-only entries and any group left empty as a result.
  if (role === "MEMBER") {
    // Resolve the member's permission set (default when unset for backwards
    // compatibility with members created before permissions existed).
    const perms = memberPermissions ?? DEFAULT_MEMBER_PERMISSIONS;
    // Build the set of hrefs this member is allowed to see (permission-gated).
    const allowedByPermission = new Set<string>();
    (Object.keys(PERMISSION_HREFS) as MemberPermission[]).forEach((p) => {
      if (perms.includes(p)) {
        PERMISSION_HREFS[p].forEach((href) => allowedByPermission.add(href));
      }
    });
    // Settings stays available to every member regardless of permissions.
    allowedByPermission.add("/settings");

    return applyHidden(
      groups
        .map((group) => ({
          ...group,
          menus: group.menus.filter(
            (menu) =>
              // Owner-only areas are always hidden for members…
              !OWNER_ONLY_HREFS.has(menu.href) &&
              // …and permission-gated areas require the matching permission.
              allowedByPermission.has(menu.href)
          ),
        }))
        .filter((group) => group.menus.length > 0)
    );
  }

  return applyHidden(groups);
}
