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
import CategoryCard from "../_components/categories/CategorieCard";
import DishCard from "../_components/plats/PlatCard";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";






export default function CategoriesPage() {
  const { theme } = useTheme();

  return (
    <ContentLayout title="Categories et plats">
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
            <BreadcrumbPage>Categories et plats</BreadcrumbPage>
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
           
                         src={"/images/empty-categorie.png"}
                         alt="Empty folder"
                         width={400} // Adjust size as needed
                         height={400}
                       />
          </div>
          <p className="text-lg  font-semibold mt-4">Aucune categorie ou plat disponible...</p>
          <p className="mt-2">Créez votre premier menu pour pouvoir ajouter des categories et des plats.</p>   
        </div>
    

<CategoryCard logo={undefined} name={"ahaha"} dishCount={2}/>
<CategoryCard logo={undefined} name={"test"} dishCount={6}/>


<DishCard imageUrl={"/images/empty-menu.png"} name={"test"} description={"test"} price={"test"} allergenes={"test"}/>
<DishCard imageUrl={"/images/empty-menu.png"} name={"test"} description={"test"} price={"test"} allergenes={"test"}/>


        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
