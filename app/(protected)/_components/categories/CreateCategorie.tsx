"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface CreateCategorieProps {
  menuId: string;
  onAddCategory: (newCategory: any) => void;
}

// A small set of icons the owner can pick to represent a category.
const ICON_OPTIONS = ["🍽️", "🥗", "🍕", "🍔", "🍰", "🥤", "🍷", "🍜", "🌮", "🍤"];

const CreateCategorie: React.FC<CreateCategorieProps> = ({ menuId, onAddCategory }) => {
  const { t } = useI18n();
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🍽️");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryName || !selectedIcon || !menuId) {
      toast.error(t("menus.requiredFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categorie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          selectedIcon,
          state: "ACTIVE",
          menuId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(t("categories.toast.createError"));
        return;
      }

      toast.success(t("categories.toast.created"));
      onAddCategory(result);

      // Reset form
      setCategoryName("");
      setSelectedIcon("🍽️");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(t("menus.toast.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex max-h-[calc(90vh-8rem)] flex-col" onSubmit={handleSubmit}>
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {/* Icon picker as a visual focal element */}
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-yellow-400/10 text-3xl">
            {selectedIcon}
          </span>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="icon">{t("categories.field.icon")}</Label>
            <Select value={selectedIcon} onValueChange={(value) => setSelectedIcon(value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("categories.chooseIcon")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="text-lg">{icon}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="categoryName">
            {t("categories.field.name")} <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="categoryName"
            placeholder={t("categories.namePlaceholder")}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </div>
      </div>

      <div className="border-t border-border px-6 py-4">
        <Button
          className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
};

export default CreateCategorie;
