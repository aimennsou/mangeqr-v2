import { OrderStatusView } from './_components/OrderStatusView';

// The diner's live order-tracking page (FEAT-1). Public (no auth) — the order
// id is an unguessable uuid. Fully dynamic; the client polls for status.
export const dynamic = 'force-dynamic';

export default function OrderStatusPage({
  params
}: {
  params: { id: string };
}) {
  return <OrderStatusView orderId={params.id} />;
}
