import { requireOrderingModule } from '../_lib/guards';
import { TablesView } from './_components/TablesView';

/**
 * FEAT-2 — Owner floor-plan / table layout page ("Plan de salle").
 *
 * Lets the owner define zones and a drag-to-arrange layout of tables per
 * restaurant. Tables feed the diner ordering flow (FEAT-1): a diner picks their
 * table number when placing a dine-in order.
 *
 * Server component: enforces the ordering module + the member `tables`
 * permission before rendering the editor (the sidebar hiding is UX only).
 */
export default async function TablesPage() {
  await requireOrderingModule('tables');
  return <TablesView />;
}
