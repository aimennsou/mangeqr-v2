import { notFound } from "next/navigation";
import { getPublicMenuData } from "../../_shared/menu-data";
import { MenuUnavailable } from "../../_shared/MenuUnavailable";
import { PublicMenu } from "../../[id]/_components/PublicMenu";

// Diner menu resolved by restaurant subdomain (e.g. artisto.mangeqr.com, which
// the middleware rewrites to this route). Fully dynamic.
export const dynamic = "force-dynamic";

export default async function SubdomainMenuPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const data = await getPublicMenuData({ subdomain: params.subdomain });
  if (!data) notFound();
  if (data.trialExpired) return <MenuUnavailable name={data.name} />;
  return <PublicMenu {...data} />;
}
