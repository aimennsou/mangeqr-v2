"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
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

interface CreateCategorieProps {
  menuId: string;
  onAddCategory: (newCategory: any) => void;
}

// A small set of icons the owner can pick to represent a category.
const ICON_OPTIONS = ["🍽️", "🥗", "🍕", "🍔", "🍰", "🥤", "🍷", "🍜", "🌮", "🍤"];

const CreateCategorie: React.FC<CreateCategorieProps> = ({ menuId, onAddCategory }) => {
  const [categoryName, setCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🍽️");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryName || !selectedIcon || !menuId) {
      toast.error("Veuillez remplir tous les champs requis.");
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
        toast.error("Une erreur est survenue.");
        return;
      }

      toast.success(`La catégorie "${result.name}" a été ajoutée avec succès.`);
      onAddCategory(result);

      // Reset form
      setCategoryName("");
      setSelectedIcon("🍽️");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Une erreur est survenue lors de l'envoi de votre demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sm:max-w-md rounded-lg overflow-hidden ">
      <div className="max-h-[400px] max-w-full overflow-y-auto p-4">
        <form className={cn("grid items-start gap-4")} onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="categoryName">Nom de la catégorie</Label>
            <Input
              type="text"
              id="categoryName"
              placeholder="e.g. Entrées"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon">Icône</Label>
            <Select value={selectedIcon} onValueChange={(value) => setSelectedIcon(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisissez une icône" />
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

          <Button
            className="bg-yellow-400 hover:bg-yellow-400 text-black"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enregistrement" : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateCategorie;
