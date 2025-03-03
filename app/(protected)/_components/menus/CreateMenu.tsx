"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Import Sonner's toast function



interface DrawerDialogDemoProps {
  onAddMenu: (newMenu: any) => void;

}

const MenuDrawerDialogDemo: React.FC<DrawerDialogDemoProps> = ({ onAddMenu }) => {
  const [name, setName] = useState("");
  const [shopId, setShopId] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !shopId || availability.length === 0) {
          toast.error("Veuillez remplir tous les champs requis."); 
      

      return;
    }

    const data = {
      name,
      availability,
      state: "ACTIVE",
      shopId,
    };

    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {

        toast.error("Une erreur est survenue."); 

       
        return;
      }


          toast.success(`Le menu "${result.name}" a été ajouté avec succès.`); // Toast for duplicate action


      const shop = shops.find((shop) => shop.id === result.shopId);
      const updatedMenu = {
        ...result,
        shop: {
          name: shop?.name,
        },
      };

      onAddMenu(updatedMenu);

      // Reset form
      setName("");
      setShopId("");
      setAvailability([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Une erreur est survenue lors de l'envoi de votre demande."); 

      
    }
  };

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch("/api/magasin");
        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }
        const data = await response.json();
        setShops(data);
      } catch (error) {
        console.error("Error fetching shops:", error);

        toast.error("Impossible de charger les restaurants."); 


      }
    };

    fetchShops();
  }, []);

  return (
    <div className="sm:max-w-md rounded-lg overflow-hidden ">

      <div className="max-h-[400px] max-w-full overflow-y-auto p-4">
        <form className={cn("grid items-start gap-4")} onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              type="text"
              id="name"
              placeholder="e.g. Menu du jour"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Label htmlFor="shop">Restaurant</Label>
          <Select onValueChange={(value) => setShopId(value)}>
            <SelectTrigger>
              <SelectValue
                className="text-foreground"
                placeholder="Choisissez un restaurant"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Label htmlFor="availability">Disponibilité</Label>
          <ToggleGroup
            size="lg"
            type="multiple"
            className="grid grid-cols-3"
            onValueChange={(values) => setAvailability(values)}
          >
            {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(
              (day) => (
                <ToggleGroupItem key={day} value={day} aria-label={`Toggle ${day}`}>
                  {day}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroup>

          <Button
            className="bg-yellow-400 hover:bg-yellow-400 text-black"
            type="submit"
          >
            Enregistrer
          </Button>
        </form>
      </div>
     
    </div>
  );
};

export default MenuDrawerDialogDemo;
