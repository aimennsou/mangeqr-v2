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

const CreatePlat = ({ }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishPrice, setDishPrice] = useState(0);
  const [allergenes, setAllergenes] = useState([]);
  const [fileKey, setFileKey] = useState(null);


  const handleDishSubmit = (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    const newDish = {
      category: selectedCategory,
      name: dishName,
      description: dishDescription,
      price: dishPrice,
      allergenes,
      fileKey,
    };
 
  };

  return (
    <div

      className="fixed flex justify-center items-center inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    >
      <div className="bg-white sm:max-w-md rounded-lg overflow-hidden shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Ajouter un plat</h2>
          <p className="text-sm text-gray-500">
            Ajouter les détails de votre plat ici.
          </p>
        </div>
        <div className="max-h-[400px] max-w-[300px] overflow-y-auto">
          <form onSubmit={handleDishSubmit}>
            <div className="flex flex-col gap-4 p-4">
              <div className="grid gap-2">
                <Label>Catégorie de plat</Label>
                <Select onValueChange={(value) => setSelectedCategory(value)}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Catégorie</SelectLabel>
                      {/* Add categories dynamically here */}
                      <SelectItem value="Entrée">Entrée</SelectItem>
                      <SelectItem value="Plat principal">Plat principal</SelectItem>
                      <SelectItem value="Dessert">Dessert</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

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
                  onValueChange={(values) => setAllergenes([])}
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
                <ImageUpload />
              </div>

              <Button type="submit" className="w-full text-black">
                Ajouter
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default CreatePlat;