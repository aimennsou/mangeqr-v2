'use client'
import { useEffect, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Plus } from "lucide-react";
import MenuDrawerDialogDemo from "../_components/menus/CreateMenu";
import MenuTable from "../_components/tables/MenuTable";
import MenuTableSkeleton from "../_components/tables/MenuTableSkeleton";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

// Map a menu returned by /api/menu (with a `restaurant` relation) to the shape
// the MenuTable expects (a `shop` object + `shopName`), keeping real fields.
const mapMenu = (menu: any) => ({
  ...menu,
  shop: menu.restaurant
    ? { id: menu.restaurant.id, name: menu.restaurant.name }
    : { id: menu.restaurantId, name: menu.shopName ?? "" },
  shopName: menu.restaurant?.name ?? menu.shopName ?? "",
});

export default function MenusPage() {
  const { theme } = useTheme();
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await fetch("/api/menu");
        if (!response.ok) {
          // 404 => no menus for this user
          setMenus([]);
          return;
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          setMenus([]);
          return;
        }
        setMenus(data.map(mapMenu));
      } catch (error) {
        console.error("Error fetching menus:", error);
        setMenus([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const handleAddMenu = (newMenu: any) => {
    setMenus((prev) => [...prev, mapMenu(newMenu)]);
    setOpen(false);
  };

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

        <div className="flex justify-end mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-400 text-black">
                <Plus className="w-4 h-4 mr-2" /> Ajouter un menu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] ">
              <DialogHeader>
                <DialogTitle>Créer votre menu</DialogTitle>
                <DialogDescription>
                  Ajoutez les détails de votre menu ici. Enregistrez lorsque vous avez terminé.
                </DialogDescription>
              </DialogHeader>

              <MenuDrawerDialogDemo onAddMenu={handleAddMenu} />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <MenuTableSkeleton />
        ) : menus.length > 0 ? (
          <MenuTable menus={menus} />
        ) : (
          <div className="text-center text-gray-500 py-6">
            <div className="flex justify-center">
              <Image
                className={`${theme === "dark" ? "dark:invert" : ""}`}
                src={"/images/empty-menu.png"}
                alt="Empty folder"
                width={400}
                height={400}
              />
            </div>
            <p className="text-lg  font-semibold mt-4">Aucun menu disponible..</p>
            <p className="mt-2">Créez votre premier restaurant pour pouvoir ajouter des menus.</p>
          </div>
        )}

        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
