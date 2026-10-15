// Normalized data passed to every physical-menu template. Templates are pure
// presentation: they receive this shape and render printable HTML/CSS.

export interface PhysicalMenuDish {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  allergenes?: string[];
}

export interface PhysicalMenuCategory {
  id: string;
  name: string;
  logo?: string | null;
  dishes: PhysicalMenuDish[];
}

export interface PhysicalMenuData {
  restaurantName: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  currencySymbol: string;
  menuName: string;
  categories: PhysicalMenuCategory[];
}

export interface MenuTemplate {
  /** Stable id used in the picker and print target. */
  id: string;
  /** Human-facing (French) label. */
  label: string;
  /** Short description shown under the label. */
  description: string;
  /** The React component that renders the printable menu. */
  Component: React.ComponentType<{ data: PhysicalMenuData }>;
}
