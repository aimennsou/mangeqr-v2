'use client'
import Link from "next/link";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";

import { useTheme } from "next-themes";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";






export default function NumeriquePage() {
  const { theme } = useTheme();

  return (
    <ContentLayout title="Menu numérique">
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
            <BreadcrumbPage>Menu numérique</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
      <CardContent className="p-6">
      <div className="mt-6">


        <div className="text-center text-gray-500 py-6">
            
            <div className="flex justify-center">
        <Image
          className={`${theme === "dark" ? "dark:invert" : ""}`}
          src="/images/empty-numerique.png"
          alt="Empty folder"
          width={400} // Adjust size as needed
          height={400}
          priority 
        />
  
        
      
   
  </div>
  <p className="text-lg  font-semibold mt-4">Aucun menu disponible..</p>
  <p className="mt-2">Créez votre premier menu pour pouvoir customiser vos interfaces..</p>  
  </div>
    




        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
