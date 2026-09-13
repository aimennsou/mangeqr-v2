import { Users } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContentLayout } from "../../_admin-panel/content-layout";
import JoinForm from "./_components/join-form";

interface JoinPageProps {
  searchParams?: { code?: string };
}

/**
 * Join page (mangeqr-team, T8). A logged-in user redeems an invite code to join
 * an owner's workspace. The `?code=` query param prefills the form. This route
 * lives under `(protected)` so it is auth-gated by the middleware.
 */
export default function JoinTeamPage({ searchParams }: JoinPageProps) {
  const initialCode = (searchParams?.code ?? "").trim().toUpperCase();

  return (
    <ContentLayout title="Rejoindre une équipe">
      <div className="mx-auto mt-6 max-w-md">
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold">
                Rejoindre un espace de travail
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Saisissez le code d&apos;invitation qui vous a été communiqué pour
              rejoindre l&apos;espace de travail et gérer ses menus.
            </p>
            <JoinForm initialCode={initialCode} />
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
