import { notFound } from 'next/navigation';

import { db } from '@/lib/db';
import { currencySymbol } from '@/lib/currency';
import { LEAD_COVER_PHOTO, leadDishPhoto } from '@/lib/lead-placeholders';
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

  // Illustrative photos, chosen at render time and never persisted — the funnel
  // asks a visitor for names and prices only, so without these the preview meant
  // to sell the product rendered as bare text rows. See lib/lead-placeholders.ts
  // for why they are not written back into LeadMenu.data.
  //
  // `dishIndex` counts across the WHOLE menu rather than per category, so the
  // fallback cycle keeps varying instead of restarting on every category and
  // giving each one the same opening photo.
  let dishIndex = 0;

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
          photo: leadDishPhoto({
            dishName: d.name,
            description: d.description,
            categoryName: c.name,
            index: dishIndex++
          }),
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
      coverUrl={LEAD_COVER_PHOTO}
      currency={currencySymbol(lead.currency)}
      menus={menus}
      orderingEnabled={false}
      tables={[]}
      previewMode
    />
  );
}
