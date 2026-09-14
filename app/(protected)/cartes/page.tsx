'use client'
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { MENU_TEMPLATES, getTemplateById } from "./_templates/registry";
import type { PhysicalMenuData } from "./_templates/types";
import { currencySymbol } from "@/lib/currency";
import PhysicalMenuOrderDialog from "./_components/PhysicalMenuOrderDialog";
import { useI18n } from "@/lib/i18n";

export default function PhysiquePage() {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [templateId, setTemplateId] = useState(MENU_TEMPLATES[0].id);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Portals need the DOM; only render the print portal after mount (SSR-safe).
  useEffect(() => setMounted(true), []);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  );

  // --- data loading (reuses existing owner APIs) ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/magasin");
        const data = res.ok ? await res.json() : [];
        setRestaurants(Array.isArray(data) ? data : []);
      } catch {
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setMenus([]);
      setSelectedMenuId("");
      return;
    }
    (async () => {
      try {
        // Scope server-side to this restaurant instead of downloading every
        // workspace menu and filtering in the browser.
        const res = await fetch(
          `/api/menu?restaurantId=${encodeURIComponent(selectedRestaurantId)}`
        );
        const data = res.ok ? await res.json() : [];
        setMenus(Array.isArray(data) ? data : []);
      } catch {
        setMenus([]);
      }
    })();
    setSelectedMenuId("");
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (!selectedMenuId) {
      setCategories([]);
      return;
    }
    (async () => {
      try {
        // Scope server-side to the selected menu instead of fetching the whole
        // workspace catalog (with every dish) and filtering client-side.
        const res = await fetch(
          `/api/categorie?menuId=${encodeURIComponent(selectedMenuId)}`
        );
        const data = res.ok ? await res.json() : [];
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      }
    })();
  }, [selectedMenuId]);

  // --- normalize into template data ---
  const menuData: PhysicalMenuData | null = useMemo(() => {
    if (!selectedRestaurant || !selectedMenuId) return null;
    const menu = menus.find((m) => m.id === selectedMenuId);
    if (!menu) return null;

    const symbol = currencySymbol(selectedRestaurant.currency);
    const cats = categories
      .filter((c) => c.menuId === selectedMenuId)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        id: c.id,
        name: c.name,
        logo: c.logo,
        dishes: [...(c.dishes ?? [])]
          .sort((a: any, b: any) => a.position - b.position)
          .map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            price: d.price,
            allergenes: d.allergenes,
          })),
      }));

    return {
      restaurantName: selectedRestaurant.name,
      address: selectedRestaurant.address,
      phone: selectedRestaurant.phone,
      website: selectedRestaurant.website,
      currencySymbol: symbol,
      menuName: menu.name,
      categories: cats,
    };
  }, [selectedRestaurant, selectedMenuId, menus, categories]);

  const Template = getTemplateById(templateId).Component;

  return (
    <ContentLayout title={t("nav.cartes")}>
      {/* Print isolation with correct multi-page flow.
          The menu is rendered into a portal appended to <body> (see below), so
          it's a top-level sibling of the app root. On print we hide the app
          root entirely and show only the portal in normal document flow, which
          lets the browser fragment it across as many pages as needed.
          Templates keep categories/dishes together with break-inside: avoid. */}
      <style jsx global>{`
        .menu-print-portal {
          display: none;
        }
        @media print {
          /* Hide the whole app; show only the portaled menu. */
          body > *:not(.menu-print-portal) {
            display: none !important;
          }
          .menu-print-portal {
            display: block !important;
          }
          .menu-print-area {
            margin: 0 !important;
            box-shadow: none !important;
            /* Ensure background colors / bands print (Moderne header, accents). */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .menu-print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* The printable root fills the @page content box (210mm - 24mm = 186mm).
             It must NOT carry a fixed 210mm width or a forced min-height, otherwise
             it overflows the printable area / leaves big blank bands. */
          .menu-print-area .menu-sheet {
            width: 100% !important;
            min-height: 0 !important;
            box-shadow: none !important;
          }
          /* Pagination rules (predictable, PDF-like cuts):
             - A dish is never split across pages.
             - A category heading never sits alone at the bottom of a page:
               it stays with the content that follows it.
             - Category sections are NOT force-kept-whole (that is what produced
               the big blank gaps for tall categories); they flow across pages,
               breaking only between whole dishes. */
          .menu-print-area .dish-row {
            break-inside: avoid;
          }
          .menu-print-area h2 {
            break-after: avoid;
          }
        }
        @page {
          size: A4;
          /* Equal margins on ALL sides -> symmetric, clean print borders.
             Printable width = 210mm - 2*12mm = 186mm; a width:100% sheet fills
             it exactly with no side clipping. */
          margin: 12mm;
        }
      `}</style>

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
            <BreadcrumbPage>{t("nav.cartes")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mt-6">
            {/* Editorial header */}
            <div className="mb-8 border-b border-border pb-6">
              <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                {t("cartes.heading")}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("cartes.subheading")}
              </p>
            </div>
            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
              <div className="grid gap-2 w-full md:max-w-xs">
                <label className="text-sm font-medium">{t("common.restaurant")}</label>
                <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.chooseRestaurant")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("common.myRestaurants")}</SelectLabel>
                      {restaurants.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 w-full md:max-w-xs">
                <label className="text-sm font-medium">{t("common.menu")}</label>
                <Select
                  value={selectedMenuId}
                  onValueChange={setSelectedMenuId}
                  disabled={!selectedRestaurantId || menus.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.chooseMenu")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("common.myMenus")}</SelectLabel>
                      {menus.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {menuData && (
                <div className="flex flex-col gap-2 sm:flex-row md:ml-auto">
                  <PhysicalMenuOrderDialog
                    restaurantId={selectedRestaurantId}
                    menuName={menuData.menuName}
                    currency={selectedRestaurant?.currency}
                  />
                  <Button
                    className="bg-yellow-400 text-black hover:bg-yellow-400/90"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4 mr-2" /> {t("cartes.print")}
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>{t("common.loading")}</span>
              </div>
            ) : menuData ? (
              <>
                {/* Template picker */}
                <div className="mb-6 flex flex-wrap gap-3">
                  {MENU_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={cn(
                        "w-56 rounded-xl border border-border p-3 text-left transition-colors",
                        templateId === t.id
                          ? "border-yellow-400 ring-2 ring-yellow-400/40"
                          : "hover:border-yellow-400/60"
                      )}
                    >
                      <p className="font-semibold">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Live preview (on screen only). The actual print output comes
                    from the portal below so it can paginate across pages.
                    The card is A4-proportioned (794px ≈ 210mm @ 96dpi) so the
                    owner sees a realistic representation of the printed page.
                    The template root uses width:100%/max-width:210mm, so here it
                    fills the 794px card, matching the printed content box. */}
                <div className="overflow-auto rounded-xl border border-border bg-muted p-6">
                  <div className="mx-auto w-full max-w-[794px] bg-white shadow-lg">
                    <Template data={menuData} />
                  </div>
                </div>

                {/* Print-only portal: rendered at <body> root so it prints in
                    normal flow and fragments across pages correctly. */}
                {mounted &&
                  createPortal(
                    <div className="menu-print-portal">
                      <div className="menu-print-area">
                        <Template data={menuData} />
                      </div>
                    </div>,
                    document.body
                  )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                <div className="flex justify-center">
                  <Image
                    className={`${theme === "dark" ? "dark:invert" : ""}`}
                    src="/images/empty-physique.png"
                    alt="Empty folder"
                    width={400}
                    height={400}
                  />
                </div>
                <p className="text-lg font-semibold mt-4 text-foreground">
                  {t("cartes.empty.title")}
                </p>
                <p className="mt-2">
                  {t("cartes.empty.subtitle")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
