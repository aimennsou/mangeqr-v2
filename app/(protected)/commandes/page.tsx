import { requireOrderingModule } from '../_lib/guards';
import { CommandesView } from './_components/CommandesView';

/**
 * FEAT-1 — Owner "Commandes" page. Live queue of incoming orders grouped by
 * table (dine-in) and a delivery group, with order numbers, items, and status
 * transitions. New orders trigger a sound + visual highlight.
 *
 * Server component: enforces the ordering module + the member `orders`
 * permission before rendering the board (the sidebar hiding is UX only).
 */
export default async function CommandesPage() {
  await requireOrderingModule('orders');
  return <CommandesView />;
}
