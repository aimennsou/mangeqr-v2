"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import CoverImageUpload from "@/components/CoverImageUpload";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { currencySymbol, currencyCode } from "@/lib/currency";

interface CreatePlatProps {
  categories: { id: string; name: string }[];
  onAddDish: (newDish: any) => void;
  /**
   * When provided, the dish is added to this category and the category
   * selector is hidden (used by the per-category "Ajouter un plat" button).
   */
  fixedCategoryId?: string;
  /**
   * The restaurant's currency (EURO | DOLLAR | DINAR). Drives the price field's
   * symbol/code so the form matches the restaurant's configured currency.
   */
  currency?: string | null;
}

const CreatePlat: React.FC<CreatePlatProps> = ({ categories, onAddDish, fixedCategoryId, currency }) => {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState(fixedCategoryId ?? "");
  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishPrice, setDishPrice] = useState(0);
  const [allergenes, setAllergenes] = useState<string[]>([]);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDishSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!dishName || !selectedCategory) {
      toast.error(t("menus.requiredFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/plat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dishName,
          description: dishDescription,
          photo: fileKey,
          price: dishPrice,
          categoryId: selectedCategory,
          allergenes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result?.error || t("restaurants.toast.genericError"));
        return;
      }

      toast.success(t("plats.toast.created"));
      onAddDish(result);

      // Reset form
      setSelectedCategory(fixedCategoryId ?? "");
      setDishName("");
      setDishDescription("");
      setDishPrice(0);
      setAllergenes([]);
      setFileKey(null);
    } catch (error) {
      console.error("Error creating dish:", error);
      toast.error(t("plats.toast.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
        <form onSubmit={handleDishSubmit} className="flex max-h-[calc(90vh-8rem)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {!fixedCategoryId && (
              <div className="grid gap-2">
                <Label>{t("plats.field.category")}</Label>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("plats.field.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("plats.field.categoryPlaceholder")}</SelectLabel>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 flex-col">
              <Label>{t("plats.field.name")}</Label>
              <Input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder={t("plats.field.namePlaceholder")}
              />
            </div>

            <div className="flex gap-2 flex-col">
              <Label>{t("plats.field.description")}</Label>
              <Textarea
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
                placeholder={t("plats.field.descPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-16">{t("plats.field.price")}</Label>
              <div className="relative flex">
                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                  {currencySymbol(currency)}
                </span>
                <Input
                  type="number"
                  value={dishPrice}
                  onChange={(e) => setDishPrice(parseFloat(e.target.value) || 0)}
                  className="-me-px rounded-e-none ps-8 shadow-none"
                  placeholder="0.00"
                />
                <span className="inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  {currencyCode(currency)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-col">
              <Label>{t("plats.field.allergens")}</Label>
              <ToggleGroup
                size={"lg"}
                type="multiple"
                className="grid grid-cols-2"
                value={allergenes}
                onValueChange={(values) => setAllergenes(values)}
              >
                {/* value stays French (stored in DB); label is translated + keeps its emoji. */}
                <ToggleGroupItem value="Arachides" aria-label="Toggle Arachides">
                  {t("allergens.Arachides")} 🥜
                </ToggleGroupItem>
                <ToggleGroupItem value="Fruits à coque" aria-label="Toggle Fruits à coque">
                  {t("allergens.Fruits à coque" as TranslationKey)} 🌰
                </ToggleGroupItem>
                <ToggleGroupItem value="Lait" aria-label="Toggle Lait">
                  {t("allergens.Lait")} 🥛
                </ToggleGroupItem>
                <ToggleGroupItem value="Œufs" aria-label="Toggle Œufs">
                  {t("allergens.Œufs" as TranslationKey)} 🥚
                </ToggleGroupItem>
                <ToggleGroupItem value="Blé" aria-label="Toggle Blé">
                  {t("allergens.Blé" as TranslationKey)} 🍚
                </ToggleGroupItem>
                <ToggleGroupItem value="Soja" aria-label="Toggle Soja">
                  {t("allergens.Soja")} 🌾
                </ToggleGroupItem>
                <ToggleGroupItem value="Piquant" aria-label="Toggle Piquant">
                  {t("allergens.Piquant")} 🌶️
                </ToggleGroupItem>
                <ToggleGroupItem value="Poisson" aria-label="Toggle Poisson">
                  {t("allergens.Poisson")} 🐟
                </ToggleGroupItem>
                <ToggleGroupItem value="Vegetarian" aria-label="Toggle Vegetarian">
                  {t("allergens.Vegetarian")} 🥦
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex gap-2 flex-col">
              <Label>{t("plats.field.photo")}</Label>
              <CoverImageUpload
                onUploaded={setFileKey}
                changeLabel={t("plats.editPhoto")}
                emptyLabel={t("upload.hint")}
              />
            </div>
          </div>

          <div className="border-t border-border px-6 py-4">
            <Button
              type="submit"
              className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("plats.adding") : t("common.add")}
            </Button>
          </div>
        </form>
  );
};

export default CreatePlat;
