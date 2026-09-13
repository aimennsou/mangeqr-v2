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
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

interface CreatePlatProps {
  categories: { id: string; name: string }[];
  onAddDish: (newDish: any) => void;
  /**
   * When provided, the dish is added to this category and the category
   * selector is hidden (used by the per-category "Ajouter un plat" button).
   */
  fixedCategoryId?: string;
}

const CreatePlat: React.FC<CreatePlatProps> = ({ categories, onAddDish, fixedCategoryId }) => {
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
      toast.error("Veuillez remplir tous les champs requis.");
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
        toast.error(result?.error || "Une erreur est survenue.");
        return;
      }

      toast.success(`Le plat "${result.name}" a été ajouté avec succès.`);
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
      toast.error("Une erreur est survenue lors de l'envoi de votre demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sm:max-w-md rounded-lg overflow-hidden">
      <div className="max-h-[500px] overflow-y-auto">
        <form onSubmit={handleDishSubmit}>
          <div className="flex flex-col gap-4 p-4">
            {!fixedCategoryId && (
              <div className="grid gap-2">
                <Label>Catégorie de plat</Label>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Catégorie</SelectLabel>
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
              <Label>Nom</Label>
              <Input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Plat du jour"
              />
            </div>

            <div className="flex gap-2 flex-col">
              <Label>Description</Label>
              <Textarea
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
                placeholder="Un plat oriental"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-16">Prix</Label>
              <div className="relative flex rounded-lg shadow-sm shadow-black/5">
                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                  €
                </span>
                <Input
                  type="number"
                  value={dishPrice}
                  onChange={(e) => setDishPrice(parseFloat(e.target.value) || 0)}
                  className="-me-px rounded-e-none ps-6 shadow-none"
                  placeholder="0.00"
                />
                <span className="inline-flex items-center rounded-e-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                  EUR
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-col">
              <Label>Allergènes & tags</Label>
              <ToggleGroup
                size={"lg"}
                type="multiple"
                className="grid grid-cols-2"
                value={allergenes}
                onValueChange={(values) => setAllergenes(values)}
              >
                <ToggleGroupItem value="Arachides" aria-label="Toggle Arachides">
                  Arachides 🥜
                </ToggleGroupItem>
                <ToggleGroupItem value="Fruits à coque" aria-label="Toggle Fruits à coque">
                  Fruits à coque 🌰
                </ToggleGroupItem>
                <ToggleGroupItem value="Lait" aria-label="Toggle Lait">
                  Lait 🥛
                </ToggleGroupItem>
                <ToggleGroupItem value="Œufs" aria-label="Toggle Œufs">
                  Œufs 🥚
                </ToggleGroupItem>
                <ToggleGroupItem value="Blé" aria-label="Toggle Blé">
                  Blé 🍚
                </ToggleGroupItem>
                <ToggleGroupItem value="Soja" aria-label="Toggle Soja">
                  Soja 🌾
                </ToggleGroupItem>
                <ToggleGroupItem value="Piquant" aria-label="Toggle Piquant">
                  Piquant 🌶️
                </ToggleGroupItem>
                <ToggleGroupItem value="Poisson" aria-label="Toggle Poisson">
                  Poisson 🐟
                </ToggleGroupItem>
                <ToggleGroupItem value="Vegetarian" aria-label="Toggle Vegetarian">
                  Vegetarian 🥦
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex gap-2 flex-col">
              <Label>Photo du plat</Label>
              <ImageUpload setFileKey={setFileKey} />
            </div>

            <Button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-400 text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ajout en cours" : "Ajouter"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlat;
