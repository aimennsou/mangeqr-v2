import { notFound } from 'next/navigation';

import { getPublicMenuData } from '../../restaurant/_shared/menu-data';
import { MenuUnavailable } from '../../restaurant/_shared/MenuUnavailable';
import { BorneKiosk } from './_components/BorneKiosk';

/**
 * Public self-order kiosk (`/borne/[id]`). A full-screen, touch-first ordering
 * flow (welcome → order type → photo menu → cart → confirmation) modeled on a
 * standard QSR kiosk. Always dynamic so it reflects the latest menu.
 */
export const dynamic = 'force-dynamic';

export default async function BorneMenuPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getPublicMenuData({ id: params.id });
  if (!data) notFound();
  if (data.trialExpired) return <MenuUnavailable name={data.name} />;
  // Kiosk (borne) must be activated for this account (#3).
  if (!data.kioskEnabled)
    return <MenuUnavailable name={data.name} reason="feature" />;

  return (
    <BorneKiosk
      restaurantId={data.restaurantId}
      name={data.name}
      currency={data.currency}
      coverUrl={data.coverUrl}
      tables={data.tables}
      borneConfig={data.borneConfig}
      menus={data.menus.map((m) => ({
        id: m.id,
        name: m.name,
        categories: m.categories.map((c) => ({
          id: c.id,
          name: c.name,
          logo: c.logo,
          dishes: c.dishes.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            price: d.price,
            photo: d.photo,
            allergenes: d.allergenes,
            addonGroups: d.addonGroups,
          })),
        })),
      }))}
    />
  );
}
