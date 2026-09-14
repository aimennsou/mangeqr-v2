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
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
    <ContentLayout title={t("nav.menus")}>
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
            <BreadcrumbPage>{t("nav.menus")}</BreadcrumbPage>
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
              {t("nav.menus")}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("menus.subheading")}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-400/90">
                <Plus className="w-4 h-4 mr-2" /> {t("menus.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] ">
              <DialogHeader>
                <DialogTitle>{t("menus.create.title")}</DialogTitle>
                <DialogDescription>
                  {t("menus.create.desc")}
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
            <p className="text-lg  font-semibold mt-4">{t("menus.empty.title")}</p>
            <p className="mt-2">{t("menus.empty.subtitle")}</p>
          </div>
        )}

        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
