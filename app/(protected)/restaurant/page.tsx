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
import { useI18n } from "@/lib/i18n";





export default function RestaurantsPage() {

  const { t } = useI18n();
 
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
    <ContentLayout title={t("nav.restaurants")}>
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
            <BreadcrumbPage>{t("nav.restaurants")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
      <CardContent className="p-6">
      <div className="mt-6 space-y-8">

        {/* Editorial header: serif title + subtitle left, add button right,
            hairline beneath. */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              {t("nav.restaurants")}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("restaurants.subheading")}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-yellow-400 text-black hover:bg-yellow-400/90"
              >
                <Plus className="w-4 h-4 mr-2" /> {t("restaurants.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] ">
              <DialogHeader>
                <DialogTitle>{t("restaurants.create.title")}</DialogTitle>
                <DialogDescription>
                  {t("restaurants.create.desc")}
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
            <p className="text-lg  font-semibold mt-4">{t("restaurants.empty.title")}</p>
            <p className="mt-2">{t("restaurants.empty.subtitle")}</p>
          </div>
        )}

        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
