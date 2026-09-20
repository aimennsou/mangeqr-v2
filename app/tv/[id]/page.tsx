import { notFound } from 'next/navigation';

import { getPublicMenuData } from '../../restaurant/_shared/menu-data';
import { TvMenuBoard } from './_components/TvMenuBoard';

/**
 * Public TV menu-board (`/tv/[id]`). A full-screen digital board meant to be
 * displayed on an in-room TV. Always dynamic so it reflects the latest menu.
 */
export const dynamic = 'force-dynamic';

export default async function TvMenuPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getPublicMenuData({ id: params.id });
  if (!data) notFound();

  return (
    <TvMenuBoard
      name={data.name}
      currency={data.currency}
      menus={data.menus.map((m) => ({
        id: m.id,
        name: m.name,
        categories: m.categories.map((c) => ({
          id: c.id,
          name: c.name,
          dishes: c.dishes.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            price: d.price,
            photo: d.photo,
          })),
        })),
      }))}
      tvConfig={data.tvConfig}
    />
  );
}
