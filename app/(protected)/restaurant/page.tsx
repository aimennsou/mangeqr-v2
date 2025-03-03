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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label"
import RestoDrawerDialogDemo from "../_components/restaurants/CreateRestaurant";
import RestoTable from "../_components/tables/RestoTable";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";





export default function RestaurantsPage() {


  const restaurants: any[] = [
    {
      id: "1",
      name: "Le Petit Bistrot",
      address: "12 Rue de Paris, 75001 Paris, France",
      phone: "+33 1 23 45 67 89",
      qrUrl: "https://example.com/menu/1",
      currency: "EUR",
      subdomain: "petitbistrot",
      Wifi: "petitwifi2025",
      Website: "https://lepetitbistrot.fr",
      Instagram: "https://instagram.com/petitbistrot",
      Tiktok: "https://tiktok.com/@petitbistrot",
      Google: "https://google.com/business/petitbistrot",
      coverPhoto: "uploads/LOGO.png"
    },
    {
      id: "2",
      name: "Sushi Zen",
      address: "45 Rue des Sushis, 75002 Paris, France",
      phone: "+33 1 98 76 54 32",
      qrUrl: "https://example.com/menu/2",
      currency: "EUR",
      subdomain: "sushizen",
      Wifi: "sushiwifi2025",
      Website: "https://sushizen.fr",
      Instagram: "https://instagram.com/sushizen",
      Tiktok: "https://tiktok.com/@sushizen",
      Google: "https://google.com/business/sushizen",
      coverPhoto: "uploads/sushi_logo.png"
    },
    {
      id: "3",
      name: "Café de la Plage",
      address: "10 Boulevard de la Plage, 75003 Paris, France",
      phone: "+33 1 45 67 89 01",
      qrUrl: "https://example.com/menu/3",
      currency: "EUR",
      subdomain: "cafedelaplage",
      Wifi: "plagewifi2025",
      Website: "https://cafedelaplage.fr",
      Instagram: "https://instagram.com/cafedelaplage",
      Tiktok: "https://tiktok.com/@cafedelaplage",
      Google: "https://google.com/business/cafedelaplage",
      coverPhoto: "uploads/plage_logo.png"
    },
    {
      id: "4",
      name: "Pasta Pronto",
      address: "67 Rue des Pâtes, 75004 Paris, France",
      phone: "+33 1 23 89 76 45",
      qrUrl: "https://example.com/menu/4",
      currency: "EUR",
      subdomain: "pastapronto",
      Wifi: "pastawifi2025",
      Website: "https://pastapronto.fr",
      Instagram: "https://instagram.com/pastapronto",
      Tiktok: "https://tiktok.com/@pastapronto",
      Google: "https://google.com/business/pastapronto",
      coverPhoto: "uploads/pasta_logo.png"
    }
  ];
  

  return (
    <ContentLayout title="Mes restaurants">
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
            <BreadcrumbPage>Mes restaurants</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
      <CardContent className="p-6">
      <div className="mt-6">


      <div className="text-center text-gray-500 py-6">
          
          <div className="flex justify-center py-16">



                  <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="text-black">                  <Plus className="w-4 h-4 mr-2" /> Ajouter un restaurant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] "> 
        <DialogHeader>
          <DialogTitle>Creer votre restaurant</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>



<RestoDrawerDialogDemo onAddRestaurant={function (newRestaurant: any): void {
                      throw new Error("Function not implemented.");
                    } }/>




        
      </DialogContent>
    </Dialog>





          </div>
         <p className="text-lg  font-semibold mt-4">Aucun restaurant disponible.</p>
          <p className="mt-2">Créez un nouveau restaurant en utilisant le bouton ci-dessus.</p>
        </div>
    

<RestoTable restaurants={restaurants} />


        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
