import { notFound } from "next/navigation";
import { getPublicMenuData } from "../_shared/menu-data";
import { PublicMenu } from "./_components/PublicMenu";

// The diner-facing menu is fully dynamic (reflects the latest owner edits) and
// must never be statically cached at build time.
export const dynamic = "force-dynamic";

export default async function PublicRestaurantMenuPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getPublicMenuData({ id: params.id });
  if (!data) notFound();
  return <PublicMenu {...data} />;
}
