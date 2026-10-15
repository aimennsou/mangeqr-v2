import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicMenuData } from "../../_shared/menu-data";
import { buildRestaurantJsonLd } from "../../_shared/menu-jsonld";
import { MenuUnavailable } from "../../_shared/MenuUnavailable";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildSubdomainMenuUrl } from "@/lib/subdomain";
import DinerMenuScreen from "../../_shared/DinerMenuScreen";

// Diner menu resolved by restaurant subdomain (e.g. artisto.mangeqr.com, which
// the middleware rewrites to this route). Fully dynamic.
export const dynamic = "force-dynamic";

/**
 * Per-restaurant metadata for the subdomain host.
 *
 * The canonical points at the SUBDOMAIN url (artisto.mangeqr.com), because the
 * same menu is reachable at two addresses — here and /restaurant/<id> — and the
 * subdomain is the one restaurants actually put on their QR codes and social
 * bios. Declaring it prevents the two from competing as duplicate content.
 */
export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}): Promise<Metadata> {
  const data = await getPublicMenuData({ subdomain: params.subdomain });
  if (!data) return { title: "Menu introuvable" };

  const title = `${data.name} — Menu`;
  const description = data.address
    ? `Découvrez la carte de ${data.name} (${data.address}) : plats, prix et disponibilités, toujours à jour.`
    : `Découvrez la carte de ${data.name} : plats, prix et disponibilités, toujours à jour.`;
  const url = buildSubdomainMenuUrl({
    id: data.restaurantId,
    subdomain: params.subdomain,
  });

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: data.trialExpired ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      url,
      title,
      description,
      ...(data.coverUrl ? { images: [{ url: data.coverUrl }] } : {}),
    },
  };
}

export default async function SubdomainMenuPage({
  params,
}: {
  params: { subdomain: string };
}) {
  const data = await getPublicMenuData({ subdomain: params.subdomain });
  if (!data) notFound();
  if (data.trialExpired) return <MenuUnavailable name={data.name} />;

  return (
    <>
      <JsonLd
        data={buildRestaurantJsonLd(data, {
          url: buildSubdomainMenuUrl({
            id: data.restaurantId,
            subdomain: params.subdomain,
          }),
          currencyCode: data.currencyCode,
        })}
      />
      <DinerMenuScreen {...data} />
    </>
  );
}
