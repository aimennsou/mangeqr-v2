import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicMenuData } from "../_shared/menu-data";
import { buildRestaurantJsonLd } from "../_shared/menu-jsonld";
import { MenuUnavailable } from "../_shared/MenuUnavailable";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPathMenuUrl } from "@/lib/subdomain";
import DinerMenuScreen from "../_shared/DinerMenuScreen";

// The diner-facing menu is fully dynamic (reflects the latest owner edits) and
// must never be statically cached at build time.
export const dynamic = "force-dynamic";

/**
 * Per-restaurant metadata. Without this every menu inherited the generic app
 * title from the root layout ("MangeQr | Ma Carte Restaurant Numérique"), so a
 * shared link or a search result gave no idea which restaurant it was.
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const data = await getPublicMenuData({ id: params.id });
  if (!data) return { title: "Menu introuvable" };

  const title = `${data.name} — Menu`;
  const description = data.address
    ? `Découvrez la carte de ${data.name} (${data.address}) : plats, prix et disponibilités, toujours à jour. اكتشف قائمة ${data.name} : الأطباق والأسعار محدّثة دائمًا.`
    : `Découvrez la carte de ${data.name} : plats, prix et disponibilités, toujours à jour. اكتشف قائمة ${data.name} : الأطباق والأسعار محدّثة دائمًا.`;
  const url = buildPathMenuUrl(params.id);

  return {
    title,
    description,
    alternates: { canonical: url },
    // An expired trial hides the menu, so don't invite indexing of a dead page.
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

export default async function PublicRestaurantMenuPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getPublicMenuData({ id: params.id });
  if (!data) notFound();
  // Owner's FREE trial ended → hide the public menu.
  if (data.trialExpired) return <MenuUnavailable name={data.name} />;

  return (
    <>
      {/* schema.org Restaurant + Menu: lets search engines read the dishes and
          prices instead of seeing an opaque client-rendered list. */}
      <JsonLd
        data={buildRestaurantJsonLd(data, {
          url: buildPathMenuUrl(params.id),
          currencyCode: data.currencyCode,
        })}
      />
      <DinerMenuScreen {...data} />
    </>
  );
}
