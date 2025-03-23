'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import UpdateProfileForm from '@/components/auth/update-profile-form';
import UpdatePasswordForm from '@/components/auth/update-password-form';
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";



export default function SettingsPage() {

  return (
    <ContentLayout title="Mon compte">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="flex mx-auto justify-center items-center gap-2">
                <Logo className="max-md:hidden" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mon compte</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mt-6">
            <div className="flex flex-row">
              {/* Titre de la page */}
              {/* Section de mise à jour du profil */}
              <section className="mb-8 mx-auto">
                <Card className="w-full">
                  <CardHeader>
                    <h3 className="text-lg md:text-xl font-semibold">Paramètres du profil</h3>
                  </CardHeader>
                  <CardContent>
                    <UpdateProfileForm />
                  </CardContent>
                </Card>
              </section>

              {/* Section de mise à jour du mot de passe */}
              <section className="mx-auto">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg md:text-xl font-semibold">Mettre à jour le mot de passe</h3>
                  </CardHeader>
                  <CardContent>
                    <UpdatePasswordForm />
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}






