import { notFound } from 'next/navigation';

import { db } from '@/lib/db';
import { currencySymbol } from '@/lib/currency';
import { PublicMenu } from '@/app/restaurant/[id]/_components/PublicMenu';

export const dynamic = 'force-dynamic';

type LeadDish = { name: string; description?: string; price: number };
type LeadCategory = { name: string; dishes: LeadDish[] };

/**
 * Public preview of a lead-gen funnel menu (anonymous, no auth). Renders the
 * same diner `PublicMenu` component used for real restaurants, mapping the
 * LeadMenu JSON into its plain-object props. `previewMode` skips analytics
 * tracking (these aren't real diner scans). Reachable at /m/<leadId>.
 */
export default async function LeadMenuPage({
  params
}: {
  params: { id: string };
}) {
  let lead: {
    id: string;
    restaurantName: string;
    currency: string;
    data: unknown;
  } | null = null;
  try {
    lead = await db.leadMenu.findUnique({
      where: { id: params.id },
      select: { id: true, restaurantName: true, currency: true, data: true }
    });
  } catch {
    lead = null;
  }
  if (!lead) notFound();

  const categories: LeadCategory[] = Array.isArray(
    (lead.data as { categories?: LeadCategory[] })?.categories
  )
    ? (lead.data as { categories: LeadCategory[] }).categories
    : [];

  const menus = [
    {
      id: 'lead-menu',
      name: lead.restaurantName,
      categories: categories.map((c, ci) => ({
        id: `c-${ci}`,
        name: c.name,
        logo: null,
        dishes: (c.dishes ?? []).map((d, di) => ({
          id: `d-${ci}-${di}`,
          name: d.name,
          description: d.description || null,
          price: Number(d.price) || 0,
          photo: null,
          allergenes: [] as string[],
          favoriteCount: 0,
          addonGroups: []
        }))
      }))
    }
  ];

  return (
    <PublicMenu
      restaurantId={`lead-${lead.id}`}
      name={lead.restaurantName}
      address=""
      phone=""
      coverUrl={null}
      currency={currencySymbol(lead.currency)}
      menus={menus}
      orderingEnabled={false}
      tables={[]}
      previewMode
    />
  );
}
