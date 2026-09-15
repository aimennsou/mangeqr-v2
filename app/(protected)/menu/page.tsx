'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Loader2, Plus } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import MenuDrawerDialogDemo from '../_components/menus/CreateMenu';
import { ContentLayout } from '../_admin-panel/content-layout';
import Logo from '@/components/Logo';
import { useI18n } from '@/lib/i18n';

import MenuCards, { type MenuItem } from './_components/MenuCards';

interface Restaurant {
  id: string;
  name: string;
}

export default function MenusPage() {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [open, setOpen] = useState(false);

  // Per-menu counts (computed from all categories/dishes, keyed by menu id).
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [dishCounts, setDishCounts] = useState<Record<string, number>>({});

  // Load restaurants once; auto-select the first.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/magasin');
        const data = res.ok ? await res.json() : [];
        const list: Restaurant[] = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedRestaurantId(list[0].id);
      } catch {
        setRestaurants([]);
      } finally {
        setLoadingRestaurants(false);
      }
    })();
  }, []);

  // Load menus for the selected restaurant.
  useEffect(() => {
    if (!selectedRestaurantId) {
      setMenus([]);
      return;
    }
    setLoadingMenus(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/menu?restaurantId=${encodeURIComponent(selectedRestaurantId)}`
        );
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data) ? data : [];
        setMenus(
          list
            .map((m: any) => ({
              id: m.id,
              name: m.name,
              availability: m.availability ?? [],
              state: m.state,
              position: m.position
            }))
            .sort((a: MenuItem, b: MenuItem) => a.position - b.position)
        );
      } catch {
        setMenus([]);
      } finally {
        setLoadingMenus(false);
      }
    })();
  }, [selectedRestaurantId]);

  // Load counts once (all categories + dishes across the workspace), keyed by
  // menu id — same source the old table used.
  useEffect(() => {
    (async () => {
      try {
        const [catsRes, dishesRes] = await Promise.all([
          fetch('/api/categorie'),
          fetch('/api/plat')
        ]);
        const cats = catsRes.ok ? await catsRes.json() : [];
        const dishes = dishesRes.ok ? await dishesRes.json() : [];

        const catCounts: Record<string, number> = {};
        (Array.isArray(cats) ? cats : []).forEach((c: any) => {
          if (c.menuId) catCounts[c.menuId] = (catCounts[c.menuId] || 0) + 1;
        });
        const dCounts: Record<string, number> = {};
        (Array.isArray(dishes) ? dishes : []).forEach((d: any) => {
          const menuId = d.category?.menuId;
          if (menuId) dCounts[menuId] = (dCounts[menuId] || 0) + 1;
        });
        setCategoryCounts(catCounts);
        setDishCounts(dCounts);
      } catch {
        // Counts are best-effort; cards still render with 0.
      }
    })();
  }, [menus.length]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  );

  const handleAddMenu = (newMenu: any) => {
    // Only add to the current view if it belongs to the selected restaurant.
    if (newMenu.restaurantId && newMenu.restaurantId !== selectedRestaurantId) {
      setOpen(false);
      return;
    }
    setMenus((prev) => [
      ...prev,
      {
        id: newMenu.id,
        name: newMenu.name,
        availability: newMenu.availability ?? [],
        state: newMenu.state ?? 'ACTIVE',
        position: newMenu.position ?? prev.length + 1
      }
    ]);
    setOpen(false);
  };

  return (
    <ContentLayout title={t('nav.menus')}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/dashboard"
                className="flex mx-auto justify-center items-center gap-2"
              >
                <Logo className="max-md:hidden" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('nav.menus')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* Editorial header */}
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                  {t('nav.menus')}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t('menus.subheading')}
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-yellow-400 text-black hover:bg-yellow-400/90"
                    disabled={!selectedRestaurantId}
                  >
                    <Plus className="mr-2 h-4 w-4" /> {t('menus.add')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('menus.create.title')}</DialogTitle>
                    <DialogDescription>
                      {selectedRestaurant
                        ? `${t('menus.create.desc')} — ${selectedRestaurant.name}`
                        : t('menus.create.desc')}
                    </DialogDescription>
                  </DialogHeader>
                  <MenuDrawerDialogDemo
                    onAddMenu={handleAddMenu}
                    defaultRestaurantId={selectedRestaurantId}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Restaurant selector */}
            {loadingRestaurants ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> {t('menus.loading')}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <div className="flex justify-center">
                  <Image
                    className={theme === 'dark' ? 'dark:invert' : ''}
                    src="/images/empty-menu.png"
                    alt="Aucun restaurant"
                    width={360}
                    height={360}
                  />
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground">
                  {t('menus.empty.title')}
                </p>
                <p className="mt-2">{t('menus.empty.subtitle')}</p>
              </div>
            ) : (
              <>
                <div className="grid w-full gap-2 sm:max-w-xs">
                  <label className="text-sm font-medium">
                    {t('common.restaurant')}
                  </label>
                  <Select
                    value={selectedRestaurantId}
                    onValueChange={setSelectedRestaurantId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.chooseRestaurant')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t('common.myRestaurants')}</SelectLabel>
                        {restaurants.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Menus for the selected restaurant */}
                {loadingMenus ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />{' '}
                    {t('menus.loading')}
                  </div>
                ) : menus.length > 0 ? (
                  <MenuCards
                    menus={menus}
                    categoryCounts={categoryCounts}
                    dishCounts={dishCounts}
                    onChange={setMenus}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                    <p className="text-lg font-semibold text-foreground">
                      {t('menus.empty.title')}
                    </p>
                    <p className="mt-2 text-sm">{t('menus.empty.subtitle')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
