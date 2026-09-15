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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Loader2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { MENU_TEMPLATES, getTemplateById } from "./_templates/registry";
import type { PhysicalMenuData } from "./_templates/types";
import { currencySymbol } from "@/lib/currency";
import PhysicalMenuOrderDialog from "./_components/PhysicalMenuOrderDialog";
import TemplateThumbnail from "./_components/TemplateThumbnail";
import MyDesignOrders from "../numerique/_components/MyDesignOrders";
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
        /* On-screen: the template sheet fills the A4-proportioned preview box so
           the owner sees the true full-page result (paper fill + spacing). */
        .menu-preview-sheet .menu-sheet {
          width: 100%;
          min-height: 100%;
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
          /* The printable root fills the full A4 page (edge to edge) so the
             template's paper background covers the whole sheet instead of a
             cream band at the top over white. With @page margin:0 the printable
             box is the full 210x297mm; the sheet fills it and provides its own
             inner padding. min-height fills the first page even for short menus
             (no huge white expanse below); content still flows to more pages. */
          .menu-print-area .menu-sheet {
            width: 100% !important;
            min-height: 297mm !important;
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
          /* Zero page margin so the template's paper background bleeds to the
             page edges (no white frame around the cream sheet). Each template
             supplies its own inner padding (in mm). margin:0 also removes the
             space Chrome reserves for its default header/footer, so the
             localhost/URL/date chrome no longer prints. */
          margin: 0;
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

            <Tabs defaultValue="design" className="w-full">
              <TabsList>
                <TabsTrigger value="design">{t("cartes.tab.design")}</TabsTrigger>
                <TabsTrigger value="orders">{t("cartes.tab.orders")}</TabsTrigger>
              </TabsList>

              {/* ---- Tab 1: design & download ---- */}
              <TabsContent value="design">
                <div className="mt-6">
                  {/* Restaurant + menu selectors + export */}
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
                      {/* Template picker — each card shows a live miniature of
                          the template rendered with the real menu. */}
                      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {MENU_TEMPLATES.map((tpl) => {
                          const active = templateId === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => setTemplateId(tpl.id)}
                              aria-pressed={active}
                              className={cn(
                                "group relative flex flex-col overflow-hidden rounded-xl border border-border text-left transition-colors",
                                active
                                  ? "border-yellow-400 ring-2 ring-yellow-400/40"
                                  : "hover:border-yellow-400/60"
                              )}
                            >
                              {active && (
                                <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-black">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                              {/* Miniature preview (top portion of the page) */}
                              <div className="flex justify-center border-b border-border bg-muted p-2">
                                <div className="overflow-hidden rounded-sm shadow-sm">
                                  <TemplateThumbnail
                                    templateId={tpl.id}
                                    data={menuData}
                                    width={200}
                                    heightRatio={0.62}
                                  />
                                </div>
                              </div>
                              <div className="p-3">
                                <p className="font-semibold">{tpl.label}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {tpl.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Live preview (on screen only). The actual print output
                          comes from the portal below so it can paginate. */}
                      <div className="overflow-auto rounded-xl border border-border bg-muted p-6">
                        <div className="menu-preview-sheet mx-auto flex w-full max-w-[794px] overflow-hidden bg-white shadow-lg [aspect-ratio:210/297]">
                          <Template data={menuData} />
                        </div>
                      </div>

                      {/* Print-only portal at <body> root so it fragments
                          across pages correctly. */}
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
                      <p className="mt-2">{t("cartes.empty.subtitle")}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ---- Tab 2: order + follow up ---- */}
              <TabsContent value="orders">
                <div className="mt-6 space-y-10">
                  {/* Order launcher */}
                  <div>
                    <h3 className="font-serif-display text-2xl font-light tracking-tight text-foreground">
                      {t("cartes.order.heading")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("cartes.order.subheading")}
                    </p>

                    {loading ? (
                      <div className="flex justify-center items-center py-16 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span>{t("common.loading")}</span>
                      </div>
                    ) : restaurants.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6">
                        <p className="text-lg font-semibold mt-4 text-foreground">
                          {t("cartes.empty.title")}
                        </p>
                        <p className="mt-2">{t("cartes.empty.subtitle")}</p>
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-col md:flex-row md:items-end gap-4">
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

                        <div className="md:ml-auto">
                          <PhysicalMenuOrderDialog
                            restaurantId={selectedRestaurantId}
                            menuName={menuData?.menuName}
                            currency={selectedRestaurant?.currency}
                            disabled={!selectedRestaurantId || !menuData}
                            templateId={templateId}
                            templateLabel={getTemplateById(templateId).label}
                            menuData={menuData}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Follow-up: physical-menu orders tracking */}
                  <div className="border-t border-border pt-8">
                    <MyDesignOrders
                      kind="physical"
                      title={t("cartes.orders.trackTitle")}
                      description={t("cartes.orders.trackDesc")}
                      emptyTitle={t("cartes.orders.emptyTitle")}
                      emptySubtitle={t("cartes.orders.emptySubtitle")}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
