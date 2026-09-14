'use client'
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import CategoryCard from "../_components/categories/CategorieCard";
import DishCard from "../_components/plats/PlatCard";
import CreateCategorie from "../_components/categories/CreateCategorie";
import CreatePlat from "../_components/plats/CreatePlat";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { currencySymbol } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

type Dish = {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  price: number;
  allergenes?: string[];
  state?: "ACTIVE" | "INACTIVE";
  position: number;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  logo?: string;
  state?: "ACTIVE" | "INACTIVE";
  position: number;
  menuId: string;
  dishes: Dish[];
};

// dnd item ids are prefixed so the handlers can tell categories from dishes.
const catId = (id: string) => `cat:${id}`;
const dishId = (id: string) => `dish:${id}`;
const rawId = (id: string) => id.slice(id.indexOf(":") + 1);
const isCat = (id: string) => id.startsWith("cat:");

// -----------------------------------------------------------------------------
// Sortable wrappers
// -----------------------------------------------------------------------------

function SortableCategory({
  category,
  children,
}: {
  category: Category;
  children: (dragHandleProps: any) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: catId(category.id), data: { type: "category", categoryId: category.id } });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

function SortableDish({
  dish,
  categoryId,
  children,
}: {
  dish: Dish;
  categoryId: string;
  children: (dragHandleProps: any) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dishId(dish.id), data: { type: "dish", dishId: dish.id, categoryId } });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export default function CategoriesPage() {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  // Categories scoped to the selected menu, each with its dishes, ordered.
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [dishDialogCategoryId, setDishDialogCategoryId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // IMPROVEMENT-5: which categories are expanded. Collapsed by default (empty
  // set = all collapsed) and NOT persisted, so every visit starts collapsed.
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategoryCollapse = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  );
  const symbol = currencySymbol(selectedRestaurant?.currency);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch("/api/magasin");
        const data = response.ok ? await response.json() : [];
        setRestaurants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setMenus([]);
      setSelectedMenuId("");
      return;
    }
    const fetchMenus = async () => {
      try {
        // Scope server-side to this restaurant instead of downloading every
        // workspace menu and filtering in the browser.
        const response = await fetch(
          `/api/menu?restaurantId=${encodeURIComponent(selectedRestaurantId)}`
        );
        const data = response.ok ? await response.json() : [];
        setMenus(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching menus:", error);
        setMenus([]);
      }
    };
    fetchMenus();
    setSelectedMenuId("");
  }, [selectedRestaurantId]);

  const fetchCategories = async () => {
    if (!selectedMenuId) {
      setCategories([]);
      return;
    }
    try {
      // Scope server-side to the selected menu so we don't download the whole
      // workspace catalog (with every dish) on each fetch.
      const response = await fetch(
        `/api/categorie?menuId=${encodeURIComponent(selectedMenuId)}`
      );
      const data = response.ok ? await response.json() : [];
      if (!Array.isArray(data)) {
        setCategories([]);
        return;
      }
      // Endpoint already scopes to selectedMenuId; the filter stays as a guard.
      // Sort both categories and each category's dishes by persisted position.
      const scoped: Category[] = data
        .filter((cat: any) => cat.menuId === selectedMenuId)
        .map((cat: any) => ({
          ...cat,
          dishes: [...(cat.dishes ?? [])].sort(
            (a: Dish, b: Dish) => a.position - b.position
          ),
        }))
        .sort((a: Category, b: Category) => a.position - b.position);
      setCategories(scoped);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (!selectedMenuId) {
      setCategories([]);
      return;
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenuId]);

  // Optimistically append the newly created category rather than re-fetching
  // the whole menu's catalog. CreateCategorie passes the created record back.
  const handleAddCategory = (newCategory?: any) => {
    setCategoryDialogOpen(false);
    if (newCategory?.id) {
      setCategories((prev) =>
        [...prev, { ...newCategory, dishes: [] } as Category].sort(
          (a, b) => a.position - b.position
        )
      );
    } else {
      fetchCategories();
    }
  };

  // Optimistically insert the newly created dish into its category.
  const handleAddDish = (newDish?: any) => {
    const targetCategoryId = newDish?.categoryId ?? dishDialogCategoryId;
    setDishDialogCategoryId(null);
    // Expand the category so the freshly added dish is visible (IMPROVEMENT-5:
    // categories are collapsed by default).
    if (targetCategoryId) {
      setExpandedCategories((prev) => new Set(prev).add(targetCategoryId));
    }
    if (newDish?.id && newDish?.categoryId) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === newDish.categoryId
            ? {
                ...cat,
                dishes: [...cat.dishes, newDish as Dish].sort(
                  (a, b) => a.position - b.position
                ),
              }
            : cat
        )
      );
    } else {
      fetchCategories();
    }
  };

  // ---------------------------------------------------------------------------
  // Persistence helpers
  // ---------------------------------------------------------------------------
  const persistCategoryOrder = async (cats: Category[]) => {
    try {
      await fetch("/api/categorie/position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          cats.map((cat, index) => ({
            categoryId: cat.id,
            position: index + 1,
            menuId: cat.menuId,
          }))
        ),
      });
    } catch (error) {
      console.error("Failed to persist category order", error);
      toast.error(t("categories.orderSaveError"));
    }
  };

  // Persist the dishes of the given categories (used after reorder / cross-move).
  const persistDishOrder = async (cats: Category[]) => {
    const payload = cats.flatMap((cat) =>
      cat.dishes.map((dish, index) => ({
        dishId: dish.id,
        position: index + 1,
        categoryId: cat.id,
      }))
    );
    if (payload.length === 0) return;
    try {
      await fetch("/api/plat/position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to persist dish order", error);
      toast.error(t("plats.orderSaveError"));
    }
  };

  // ---------------------------------------------------------------------------
  // Drag handlers (multi-container)
  // ---------------------------------------------------------------------------
  const findCategoryIdOfDish = (dishRawId: string) =>
    categories.find((cat) => cat.dishes.some((d) => d.id === dishRawId))?.id;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Move a dish between categories live, as it's dragged over another container.
  const handleDragOver = (event: DragOverEvent) => {
    const activeIdStr = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || isCat(activeIdStr)) return; // only dishes move across containers

    const activeDishId = rawId(activeIdStr);
    const sourceCatId = findCategoryIdOfDish(activeDishId);
    if (!sourceCatId) return;

    // Determine the destination category: either an over-dish's category or a
    // category container itself.
    let destCatId: string | undefined;
    if (isCat(overId)) {
      destCatId = rawId(overId);
    } else {
      destCatId = findCategoryIdOfDish(rawId(overId));
    }
    if (!destCatId || destCatId === sourceCatId) return;

    setCategories((prev) => {
      const source = prev.find((c) => c.id === sourceCatId);
      const dest = prev.find((c) => c.id === destCatId);
      if (!source || !dest) return prev;

      const movingDish = source.dishes.find((d) => d.id === activeDishId);
      if (!movingDish) return prev;

      // Insert at the position of the over-dish (or append if over the container).
      let insertIndex = dest.dishes.length;
      if (!isCat(overId)) {
        const overDishId = rawId(overId);
        const idx = dest.dishes.findIndex((d) => d.id === overDishId);
        if (idx >= 0) insertIndex = idx;
      }

      return prev.map((cat) => {
        if (cat.id === sourceCatId) {
          return { ...cat, dishes: cat.dishes.filter((d) => d.id !== activeDishId) };
        }
        if (cat.id === destCatId) {
          const next = [...cat.dishes];
          next.splice(insertIndex, 0, { ...movingDish, categoryId: destCatId! });
          return { ...cat, dishes: next };
        }
        return cat;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeIdStr = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveId(null);
    if (!overId) return;

    // Category reordering.
    if (isCat(activeIdStr) && isCat(overId)) {
      if (activeIdStr === overId) return;
      const oldIndex = categories.findIndex((c) => catId(c.id) === activeIdStr);
      const newIndex = categories.findIndex((c) => catId(c.id) === overId);
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(categories, oldIndex, newIndex);
      setCategories(reordered);
      persistCategoryOrder(reordered);
      return;
    }

    // Dish reordering (within its current category after any cross-move in over).
    if (!isCat(activeIdStr)) {
      const activeDishId = rawId(activeIdStr);
      const currentCatId = findCategoryIdOfDish(activeDishId);
      if (!currentCatId) return;

      let next = categories;
      if (!isCat(overId)) {
        const overDishId = rawId(overId);
        const overCatId = findCategoryIdOfDish(overDishId);
        if (overCatId === currentCatId && activeDishId !== overDishId) {
          next = categories.map((cat) => {
            if (cat.id !== currentCatId) return cat;
            const oldIndex = cat.dishes.findIndex((d) => d.id === activeDishId);
            const newIndex = cat.dishes.findIndex((d) => d.id === overDishId);
            if (oldIndex < 0 || newIndex < 0) return cat;
            return { ...cat, dishes: arrayMove(cat.dishes, oldIndex, newIndex) };
          });
          setCategories(next);
        }
      }
      // Persist the affected dishes (covers both reorder and cross-category move
      // performed in handleDragOver).
      persistDishOrder(next);
    }
  };

  const activeDish = useMemo(() => {
    if (!activeId || isCat(activeId)) return null;
    const id = rawId(activeId);
    for (const cat of categories) {
      const d = cat.dishes.find((dd) => dd.id === id);
      if (d) return d;
    }
    return null;
  }, [activeId, categories]);

  const activeCategory = useMemo(() => {
    if (!activeId || !isCat(activeId)) return null;
    return categories.find((c) => c.id === rawId(activeId)) ?? null;
  }, [activeId, categories]);

  const categoryOptions = categories.map((cat) => ({ id: cat.id, name: cat.name }));

  return (
    <ContentLayout title={t("categories.title")}>
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
            <BreadcrumbPage>{t("categories.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
        <CardContent className="p-6">
          <div className="mt-6">
            {/* Editorial header: serif title + subtitle, hairline beneath. */}
            <div className="mb-8 border-b border-border pb-6">
              <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                {t("categories.title")}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("categories.subheading")}
              </p>
            </div>
            {/* Restaurant + menu selectors and the single top-level add-category action */}
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
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
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
                      {menus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {selectedMenuId && (
                <div className="md:ml-auto">
                  <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-yellow-400 text-black hover:bg-yellow-400/90">
                        <Plus className="w-4 h-4 mr-2" /> {t("categories.add")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[480px]">
                      <DialogHeader className="border-b border-border px-6 py-5">
                        <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
                          {t("categories.create.title")}
                        </DialogTitle>
                        <DialogDescription>
                          {t("categories.create.desc")}
                        </DialogDescription>
                      </DialogHeader>
                      <CreateCategorie menuId={selectedMenuId} onAddCategory={handleAddCategory} />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>{t("common.loading")}</span>
              </div>
            ) : selectedMenuId && categories.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => catId(c.id))}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-6">
                    {categories.map((category) => {
                      const isExpanded = expandedCategories.has(category.id);
                      return (
                      <SortableCategory key={category.id} category={category}>
                        {(dragHandleProps) => (
                          <div className="overflow-hidden rounded-xl border border-border bg-card">
                            {/* Category header (with the add-dish action inline) */}
                            <CategoryCard
                              id={category.id}
                              logo={category.logo}
                              logoValue={category.logo}
                              name={category.name}
                              dishCount={category.dishes?.length ?? 0}
                              state={category.state}
                              onChanged={fetchCategories}
                              dragHandleProps={dragHandleProps}
                              bare
                              collapsible
                              collapsed={!isExpanded}
                              onToggleCollapse={() => toggleCategoryCollapse(category.id)}
                              headerAction={
                                <Dialog
                                  open={dishDialogCategoryId === category.id}
                                  onOpenChange={(open) =>
                                    setDishDialogCategoryId(open ? category.id : null)
                                  }
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="whitespace-nowrap bg-yellow-400 text-black hover:bg-yellow-400/90"
                                    >
                                      <Plus className="w-4 h-4 mr-1" /> {t("plats.add")}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[480px]">
                                    <DialogHeader className="border-b border-border px-6 py-5">
                                      <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
                                        {t("plats.add")}
                                      </DialogTitle>
                                      <DialogDescription>
                                        {t("plats.addTo").replace("{name}", category.name)}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <CreatePlat
                                      categories={categoryOptions}
                                      fixedCategoryId={category.id}
                                      onAddDish={handleAddDish}
                                    />
                                  </DialogContent>
                                </Dialog>
                              }
                            />

                            {/* Category body: dishes live visually inside the
                                category. Only rendered when expanded
                                (IMPROVEMENT-5). Collapsed by default. */}
                            {isExpanded && (
                            <div className="border-t border-border bg-muted/30 p-4">
                              <SortableContext
                                items={category.dishes.map((d) => dishId(d.id))}
                                strategy={verticalListSortingStrategy}
                              >
                                {category.dishes.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {category.dishes.map((dish) => (
                                      <SortableDish
                                        key={dish.id}
                                        dish={dish}
                                        categoryId={category.id}
                                      >
                                        {(dishHandleProps) => (
                                          <DishCard
                                            id={dish.id}
                                            imageUrl={dish.photo || "/images/empty-menu.png"}
                                            name={dish.name}
                                            description={dish.description || ""}
                                            price={`${dish.price} ${symbol}`}
                                            priceValue={dish.price}
                                            photoValue={dish.photo}
                                            allergenes={(dish.allergenes || []).join(", ")}
                                            state={dish.state}
                                            currencySymbol={symbol}
                                            onChanged={fetchCategories}
                                            dragHandleProps={dishHandleProps}
                                          />
                                        )}
                                      </SortableDish>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="py-4 text-center text-sm text-muted-foreground">
                                    {t("plats.empty")}
                                  </p>
                                )}
                              </SortableContext>
                            </div>
                            )}
                          </div>
                        )}
                      </SortableCategory>
                      );
                    })}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeDish ? (
                    <DishCard
                      id={activeDish.id}
                      imageUrl={activeDish.photo || "/images/empty-menu.png"}
                      name={activeDish.name}
                      description={activeDish.description || ""}
                      price={`${activeDish.price} ${symbol}`}
                      allergenes={(activeDish.allergenes || []).join(", ")}
                      state={activeDish.state}
                    />
                  ) : activeCategory ? (
                    <CategoryCard
                      id={activeCategory.id}
                      logo={<span className="text-2xl">{activeCategory.logo}</span>}
                      name={activeCategory.name}
                      dishCount={activeCategory.dishes?.length ?? 0}
                      state={activeCategory.state}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : selectedMenuId ? (
              // Menu selected but no categories yet — prompt to add the first one.
              <div className="text-center text-gray-500 py-16">
                <p className="text-lg font-semibold">{t("categories.noCategories.title")}</p>
                <p className="mt-2">
                  {t("categories.noCategories.subtitle")}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-6">
                <div className="flex justify-center">
                  <Image
                    className={`${theme === "dark" ? "dark:invert" : ""}`}
                    src={"/images/empty-categorie.png"}
                    alt="Empty folder"
                    width={400}
                    height={400}
                  />
                </div>
                <p className="text-lg  font-semibold mt-4">
                  {t("categories.emptySelection.title")}
                </p>
                <p className="mt-2">
                  {t("categories.emptySelection.subtitle")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
