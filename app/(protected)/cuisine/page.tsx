import { requireOrderingModule } from '../_lib/guards';
import { CuisineView } from './_components/CuisineView';

/**
 * FEAT-1 — Kitchen view (D17). A dedicated full-screen board of ACTIVE orders
 * organized by status column, for owner + members (staff). Polls for updates
 * and plays a chime on new orders.
 *
 * Server component: enforces the ordering module + the member `orders`
 * permission before rendering the board (the sidebar hiding is UX only).
 */
export default async function CuisinePage() {
  await requireOrderingModule('orders');
  return <CuisineView />;
}
