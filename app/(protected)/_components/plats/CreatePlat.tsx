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
  const [errors, setErrors] = useState<{ category?: string; name?: string; price?: string }>({});

  const handleDishSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Inline validation: category (unless fixed), name, and a positive price.
    const nextErrors: { category?: string; name?: string; price?: string } = {};
    if (!fixedCategoryId && !selectedCategory) nextErrors.category = t("validation.selectCategory");
    if (!dishName.trim()) nextErrors.name = t("validation.required");
    if (!(dishPrice > 0)) nextErrors.price = t("validation.pricePositive");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
              <div className="grid gap-1.5">
                <Label>{t("plats.field.category")} <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                  }}
                >
                  <SelectTrigger className={`w-full ${errors.category ? "border-red-500 focus:ring-red-500" : ""}`}>
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
                {errors.category ? <p className="text-xs text-red-500">{errors.category}</p> : null}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>{t("plats.field.name")} <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={dishName}
                onChange={(e) => {
                  setDishName(e.target.value);
                  if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                }}
                aria-invalid={!!errors.name}
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder={t("plats.field.namePlaceholder")}
              />
              {errors.name ? <p className="text-xs text-red-500">{errors.name}</p> : null}
            </div>

            <div className="flex gap-2 flex-col">
              <Label>{t("plats.field.description")}</Label>
              <Textarea
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
                placeholder={t("plats.field.descPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="input-16">{t("plats.field.price")} <span className="text-red-500">*</span></Label>
              <div className="relative flex">
                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                  {currencySymbol(currency)}
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={dishPrice}
                  onChange={(e) => {
                    setDishPrice(parseFloat(e.target.value) || 0);
                    if (errors.price) setErrors((er) => ({ ...er, price: undefined }));
                  }}
                  aria-invalid={!!errors.price}
                  className={`-me-px rounded-e-none ps-8 shadow-none ${errors.price ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  placeholder="0.00"
                />
                <span className="inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  {currencyCode(currency)}
                </span>
              </div>
              {errors.price ? <p className="text-xs text-red-500">{errors.price}</p> : null}
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
