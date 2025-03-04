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
import { Plus } from "lucide-react";
import RestoDrawerDialogDemo from "../_components/restaurants/CreateRestaurant";
import RestoTable from "../_components/tables/RestoTable";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@/types";
import { useEffect, useState } from "react";





export default function RestaurantsPage() {


 
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);



  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/magasin');
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data);
        console.log("retrieved restaurants : ", data)
      } else {
        console.error('Failed to fetch restaurants');
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Fetch user and categories when the component mounts
    const fetchData = async () => {
 
      await fetchRestaurants();

    };

    fetchData();
  }, []); // Empty dependency array, runs only on mount


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
