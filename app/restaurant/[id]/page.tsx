import { notFound } from "next/navigation";
import { getPublicMenuData } from "../_shared/menu-data";
import { MenuUnavailable } from "../_shared/MenuUnavailable";
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
  // Owner's FREE trial ended → hide the public menu.
  if (data.trialExpired) return <MenuUnavailable name={data.name} />;
  return <PublicMenu {...data} />;
}
