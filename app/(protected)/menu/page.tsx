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
import DrawerDialogDemo from "../_components/menus/CreateMenu";
import MenuDrawerDialogDemo from "../_components/menus/CreateMenu";
import MenuTable from "../_components/tables/MenuTable";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";



const dummyMenus: any[] = [
  {
    position: 1,
    id: "menu1",
    name: "Menu du Jour",
    shopName: "Le Gourmet",
    availability: ["Lundi", "Mardi", "Mercredi"],
    state: "ACTIVE",
    shop: {
      id: "shop1",
      name: "Le Gourmet",
      numberOfCategories: 3,
      numberOfDishes: 5,
    },
    numberOfCategories: 3,
    numberOfDishes: 5,
  },
  {
    position: 2,
    id: "menu2",
    name: "Menu Végétarien",
    shopName: "Vegan Vibes",
    availability: ["Jeudi", "Vendredi"],
    state: "INACTIVE",
    shop: {
      id: "shop2",
      name: "Vegan Vibes",
      numberOfCategories: 4,
      numberOfDishes: 6,
    },
    numberOfCategories: 4,
    numberOfDishes: 6,
  },
  {
    position: 3,
    id: "menu3",
    name: "Menu Détox",
    shopName: "Healthy Eats",
    availability: ["Samedi", "Dimanche"],
    state: "ACTIVE",
    shop: {
      id: "shop3",
      name: "Healthy Eats",
      numberOfCategories: 2,
      numberOfDishes: 4,
    },
    numberOfCategories: 2,
    numberOfDishes: 4,
  },
];



export default function MenusPage() {
  const { theme } = useTheme();

  return (
    <ContentLayout title="Menus">
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
            <BreadcrumbPage>Menus</BreadcrumbPage>
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
     
                   src={"/images/empty-menu.png"}
                   alt="Empty folder"
                   width={400} // Adjust size as needed
                   height={400}
                 />
          </div>
          <p className="text-lg  font-semibold mt-4">Aucun menu disponible..</p>
          <p className="mt-2">Créez votre premier restaurant pour pouvoir ajouter des menus.</p>        </div>
    

          <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="text-black">                  <Plus className="w-4 h-4 mr-2" /> Ajouter une menu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] "> 
        <DialogHeader>
          <DialogTitle>Creer votre restaurant</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>



<MenuDrawerDialogDemo onAddMenu={function (newRestaurant: any): void {
                  throw new Error("Function not implemented.");
                } } />




        
      </DialogContent>
    </Dialog>




<MenuTable menus={dummyMenus} />


        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
