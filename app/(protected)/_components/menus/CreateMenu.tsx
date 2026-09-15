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
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";



interface DrawerDialogDemoProps {
  onAddMenu: (newMenu: any) => void;
  /**
   * When provided, the menu is created for this restaurant and the restaurant
   * selector is hidden (used by the card-based Menus page where the restaurant
   * is chosen at the top of the page).
   */
  defaultRestaurantId?: string;
}

const MenuDrawerDialogDemo: React.FC<DrawerDialogDemoProps> = ({ onAddMenu, defaultRestaurantId }) => {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [restaurantId, setShopId] = useState(defaultRestaurantId ?? "");
  const [availability, setAvailability] = useState<string[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);

  // Keep the internal restaurant id in sync when the page-level selection
  // changes (the dialog may be mounted before the user switches restaurants).
  useEffect(() => {
    if (defaultRestaurantId) setShopId(defaultRestaurantId);
  }, [defaultRestaurantId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !restaurantId || availability.length === 0) {
          toast.error(t("menus.requiredFields")); 
      

      return;
    }

    const data = {
      name,
      availability,
      state: "ACTIVE",
      restaurantId,
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
        // Surface the specific server message (e.g. plan limit reached)
        // instead of a generic error.
        toast.error(result?.error || t("restaurants.toast.genericError"));
        return;
      }


          toast.success(t("menus.toast.added"));


      const restaurant = shops.find((restaurant) => restaurant.id === result.restaurantId);
      const updatedMenu = {
        ...result,
        restaurant: {
          name: restaurant?.name,
        },
      };

      onAddMenu(updatedMenu);

      // Reset form
      setName("");
      setShopId("");
      setAvailability([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(t("menus.toast.submitError")); 

      
    }
  };

  useEffect(() => {
    // When a default restaurant is provided the selector is hidden, so we don't
    // need to load the restaurant list.
    if (defaultRestaurantId) return;
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

        toast.error(t("menus.toast.loadRestaurantsError")); 


      }
    };

    fetchShops();
  }, [defaultRestaurantId]);

  return (
    <div className="sm:max-w-md rounded-lg overflow-hidden ">

      <div className="max-h-[400px] max-w-full overflow-y-auto p-4">
        <form className={cn("grid items-start gap-4")} onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">{t("menus.field.name")}</Label>
            <Input
              type="text"
              id="name"
              placeholder="e.g. Menu du jour"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {defaultRestaurantId ? null : (
            <>
              <Label htmlFor="restaurant">{t("common.restaurant")}</Label>
              <Select onValueChange={(value) => setShopId(value)}>
                <SelectTrigger>
                  <SelectValue
                    className="text-foreground"
                    placeholder={t("common.chooseRestaurant")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {shops.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </>
          )}

          <Label htmlFor="availability">{t("menus.field.availability")}</Label>
          <ToggleGroup
            size="lg"
            type="multiple"
            className="grid grid-cols-3 gap-2"
            value={availability}
            onValueChange={(values) => setAvailability(values)}
          >
            {/* Value stays the French weekday (stored in DB); only the label is
                translated so availability data remains consistent. */}
            {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(
              (day) => (
                <ToggleGroupItem
                  key={day}
                  value={day}
                  aria-label={`Toggle ${day}`}
                  className="border border-border bg-transparent text-muted-foreground hover:bg-muted data-[state=on]:border-green-500 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:hover:bg-green-200 dark:data-[state=on]:border-green-700 dark:data-[state=on]:bg-green-900/40 dark:data-[state=on]:text-green-400"
                >
                  {t(`common.days.${day}` as TranslationKey)}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroup>

          <Button
            className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
            type="submit"
          >
            {t("common.save")}
          </Button>
        </form>
      </div>
     
    </div>
  );
};

export default MenuDrawerDialogDemo;
