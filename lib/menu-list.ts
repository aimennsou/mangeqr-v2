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
 
} from "lucide-react";



type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon 
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "Tableau de bord",
      menus: [
        {
          href: "/dashboard",
          label: "Mes performances",
          active: pathname.includes("/dashboard"),
          icon: Gauge,
          submenus: []
        },
     
  
      ]
    },
    {
      groupLabel: "Mon activité",
      menus: [

        {
          href: "/restaurant",
          label: "Mes restaurants",
          active: pathname.includes("/restaurant"),
          icon: Store,
          submenus: []
        }, 


        {
          href: "/menu",
          label: "Menus",
          active: pathname.includes("/menu"),
          icon: Menu,
          submenus: [
            
          ]
        },
        {
          href: "/categories",
          label: "Catégories & plats",
          active: pathname.includes("/categories"),
          icon: Palette,
          submenus: [
            
          ]
        },
        
  
      ]
    },


{
  groupLabel: "Ma clientèle",
  menus: [

    {
      href: "/reviews",
      label: "Avis clients",
      active: pathname.includes("/reviews"),
      icon: Users,
      submenus: [
        
      ]
    },
    {
      href: "/marketing",
      label: "Campagne marketing",
            active: pathname.includes("/marketing"),
      icon: Send,
      submenus: []
    },
  ]
},


{
  groupLabel: "Personalisations",
  menus: [

    {
      href: "/interface",
      label: "Menu numérique",
      active: pathname.includes("/interface"),
      icon: QrCode,
      submenus: []
    },
    {
      href: "/cartes",
      label: "Menu physique",
      active: pathname.includes("/cartes"),
      icon: SquarePen,
      submenus: []
    },
  ]
},

    {
      groupLabel: "Parametres",
      menus: [

        {
          href: "/account",
          label: "Mon compte",
          active: pathname.includes("/account"),
          icon: Settings,
          submenus: []
        }
      ]
    }
  ];
}
