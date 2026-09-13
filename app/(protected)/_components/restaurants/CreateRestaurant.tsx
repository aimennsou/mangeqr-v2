"use client";
import * as React from "react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, DollarSign, Euro } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PhoneInput } from "@/components/phone-input";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getRootDomain } from "@/lib/subdomain";
import { useI18n } from "@/lib/i18n";

interface DrawerDialogDemoProps {
  onAddRestaurant: (newRestaurant: any) => void;
}

const RestoDrawerDialogDemo: React.FC<DrawerDialogDemoProps> = ({ onAddRestaurant }) => {
  const { t } = useI18n();
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState<string>("EURO");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      address: formData.get("adresse"),
      phone: phoneNumber,
      coverPhoto: fileKey,
      subdomain: formData.get("subdomain"),
      wifi: formData.get("wifi"),
      website: formData.get("website"),
      instagram: formData.get("instagram"),
      tiktok: formData.get("tiktok"),
      google: formData.get("google"),
      currency,
    };

    try {
      const response = await fetch("/api/magasin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t("restaurants.toast.created"));
        onAddRestaurant(result);
      } else {
        // Surface the specific server message (e.g. subdomain taken/invalid).
        toast.error(result?.error || t("restaurants.toast.genericError"));
      }
    } catch (error) {
      console.error("An error occurred:", error);
      toast.error(t("restaurants.toast.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="bg-background  overflow-y-auto px-2 rounded-lg overflow-hidden ">

        <form onSubmit={handleSubmit} className="max-h-[400px]  ">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t("restaurants.field.nameEstab")}</Label>
              <Input name="name" type="text" id="name" placeholder="e.g. Artisto food" />
            </div>
            <div>
              <Label htmlFor="adresse">{t("restaurants.field.addressReq")}</Label>
              <Input name="adresse" type="text" id="adresse" placeholder="e.g. Rue de paris, France" />
            </div>
            <div>
              <Label htmlFor="tel">{t("restaurants.field.phoneReq")}</Label>
              <PhoneInput value={phoneNumber} onChange={setPhoneNumber} placeholder={t("restaurants.field.phonePlaceholder")} />
            </div>
            <div>
              <Label htmlFor="subdomain">{t("restaurants.field.subdomain")}</Label>
              <div className="flex">
                <Input id="subdomain" name="subdomain" placeholder="artisto" />
                <span className="inline-flex items-center rounded-e-lg border border-input bg-gray-100 px-3 text-sm text-gray-600">
                  .{getRootDomain()}
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="currency">{t("restaurants.field.currency")}</Label>
              <ToggleGroup value={currency} onValueChange={setCurrency} type="single" className="grid grid-cols-3">
                <ToggleGroupItem value="EURO">
                  <Euro className="w-4 h-4 mr-2" /> Euro
                </ToggleGroupItem>
                <ToggleGroupItem value="DOLLAR">
                  <DollarSign className="w-4 h-4 mr-2" /> Dollar
                </ToggleGroupItem>
                <ToggleGroupItem value="DINAR">
                  <Coins className="w-4 h-4 mr-2" /> Dinar
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div>
              <Label htmlFor="wifi">{t("restaurants.field.wifi")}</Label>
              <Input name="wifi" type="text" id="wifi" placeholder="e.g. wifi-pass" />
            </div>
            <div>
              <Label htmlFor="website">{t("restaurants.field.website")}</Label>
              <Input name="website" type="text" id="website" placeholder="www.example.com" />
            </div>
            <div>
              <Label htmlFor="instagram">{t("restaurants.field.instagram")}</Label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-input bg-gray-100 px-3 text-sm text-gray-600">
                  instagram.com/
                </span>
                <Input name="instagram" type="text" id="instagram" placeholder="artisto" />
              </div>
            </div>
            <div>
              <Label htmlFor="tiktok">{t("restaurants.field.tiktok")}</Label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-input bg-gray-100 px-3 text-sm text-gray-600">
                  tiktok.com/
                </span>
                <Input name="tiktok" type="text" id="tiktok" placeholder="@artisto" />
              </div>
            </div>
            <div>
              <Label htmlFor="google">{t("restaurants.field.google")}</Label>
              <Input name="google" type="text" id="google" placeholder="e.g. https://g.page/r/CZm8bK6bE_Zeld6" />
            </div>
            <div>
              <Label htmlFor="logo">{t("restaurants.field.cover")}</Label>
              <ImageUpload setFileKey={setFileKey} />
            </div>
            <Button
              className="bg-yellow-400 hover:bg-yellow-400 w-full text-black"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
  
      </div>

  );
};

export default RestoDrawerDialogDemo;
