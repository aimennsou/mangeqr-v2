import { notFound } from 'next/navigation';

import { getPublicMenuData } from '../../restaurant/_shared/menu-data';
import { BorneView } from './_components/BorneView';

/**
 * Public self-order kiosk (`/borne/[id]`). A touch-first ordering view meant to
 * run on an in-store kiosk. Always dynamic so it reflects the latest menu.
 */
export const dynamic = 'force-dynamic';

export default async function BorneMenuPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getPublicMenuData({ id: params.id });
  if (!data) notFound();

  // Strip the config fields PublicMenu doesn't accept; forward the rest.
  const { tvConfig: _tv, borneConfig, ...menu } = data;

  return <BorneView menu={menu} borneConfig={borneConfig} />;
}
