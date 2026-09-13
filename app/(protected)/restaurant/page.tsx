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
import RestoTableSkeleton from "../_components/tables/RestoTableSkeleton";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@/types";
import { useEffect, useState } from "react";





export default function RestaurantsPage() {


 
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);



  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/magasin');
      if (response.ok) {
        const data = await response.json();
        // The API returns a `{ message }` object (not an array) when the user
        // has no restaurants yet; guard against that so the table gets an array.
        setRestaurants(Array.isArray(data) ? data : []);
      } else {
        // 404 = no restaurants for this user; treat as an empty list.
        setRestaurants([]);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
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

  const handleAddRestaurant = (newRestaurant: Restaurant) => {
    setRestaurants((prev) => [...prev, newRestaurant]);
    setDialogOpen(false);
  };

  const hasRestaurants = restaurants.length > 0;


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

        <div className="flex justify-end mb-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-black">
                <Plus className="w-4 h-4 mr-2" /> Ajouter un restaurant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] ">
              <DialogHeader>
                <DialogTitle>Créer votre restaurant</DialogTitle>
                <DialogDescription>
                  Renseignez les informations de votre établissement puis enregistrez.
                </DialogDescription>
              </DialogHeader>

              <RestoDrawerDialogDemo onAddRestaurant={handleAddRestaurant} />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <RestoTableSkeleton />
        ) : hasRestaurants ? (
          <RestoTable restaurants={restaurants} />
        ) : (
          <div className="text-center text-gray-500 py-6">
            <div className="flex justify-center py-8" />
            <p className="text-lg  font-semibold mt-4">Aucun restaurant disponible.</p>
            <p className="mt-2">Créez un nouveau restaurant en utilisant le bouton ci-dessus.</p>
          </div>
        )}

        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
