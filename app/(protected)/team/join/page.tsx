import { cookies } from "next/headers";
import { Users } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { translate } from "@/lib/i18n/translate";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale
} from "@/lib/i18n/config";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { ContentLayout } from "../../_admin-panel/content-layout";
import JoinForm from "./_components/join-form";

interface JoinPageProps {
  searchParams?: { code?: string };
}

/**
 * Join page (mangeqr-team, T8). A logged-in user redeems an invite code to join
 * an owner's workspace. The `?code=` query param prefills the form. This route
 * lives under `(protected)` so it is auth-gated by the middleware.
 *
 * Server component, so copy resolves from the locale cookie via the pure
 * `translate` helper. A client language switch re-renders it because `setLocale`
 * calls `router.refresh()`.
 */
export default function JoinTeamPage({ searchParams }: JoinPageProps) {
  const initialCode = (searchParams?.code ?? "").trim().toUpperCase();

  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = (key: TranslationKey) => translate(locale, key);

  return (
    <ContentLayout title={t("join.navTitle")}>
      <div className="mx-auto mt-6 max-w-md">
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold">
                {t("join.heading")}
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("join.body")}</p>
            <JoinForm initialCode={initialCode} />
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
