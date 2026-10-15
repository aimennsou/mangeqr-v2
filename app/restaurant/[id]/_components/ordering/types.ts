/**
 * Shared types for the diner ordering flow (FEAT-1). Kept separate so the
 * PublicMenu, cart, add-on picker, and checkout components share one shape.
 */

export interface AddonOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTI';
  required: boolean;
  options: AddonOption[];
}

export interface OrderableDish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo: string | null;
  allergenes: string[];
  addonGroups: AddonGroup[];
}

export interface DinerTable {
  id: string;
  label: string;
}

/** A line the diner added to the cart, with resolved add-on selections. */
export interface CartLine {
  // Unique per cart line (a dish added twice with different add-ons = 2 lines).
  lineId: string;
  dishId: string;
  dishName: string;
  unitPrice: number;
  quantity: number;
  // Selected options (denormalized for display + submit).
  options: { id: string; groupName: string; name: string; priceDelta: number }[];
  specialRequest: string;
}

/** Per-line total = (unit + sum(addon deltas)) * qty. */
export function lineTotal(line: CartLine): number {
  const addons = line.options.reduce((s, o) => s + o.priceDelta, 0);
  return (line.unitPrice + addons) * line.quantity;
}
