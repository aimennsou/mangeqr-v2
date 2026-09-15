"use client";
import * as React from "react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Coins,
  DollarSign,
  Euro,
  Globe,
  Instagram,
  MapPin,
  Music2,
  Phone,
  Store,
  Wifi,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import CoverImageUpload from "@/components/CoverImageUpload";
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
  const [errors, setErrors] = useState<{ name?: string; adresse?: string; phone?: string }>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const address = String(formData.get("adresse") ?? "").trim();
    const phone = phoneNumber.trim();

    // Inline required-field validation: highlight each missing field and show a
    // message under it, then focus the first invalid one.
    const nextErrors: { name?: string; adresse?: string; phone?: string } = {};
    if (!name) nextErrors.name = t("validation.required");
    if (!address) nextErrors.adresse = t("validation.required");
    if (!phone) nextErrors.phone = t("validation.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = event.currentTarget.querySelector<HTMLElement>(
        nextErrors.name ? "#name" : nextErrors.adresse ? "#adresse" : "[name=phone]"
      );
      firstInvalid?.focus();
      firstInvalid?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    const data = {
      name,
      address,
      phone,
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
    <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-8rem)] flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {/* Cover photo — focal element at the top */}
        <div className="space-y-2">
          <Label>{t("restaurants.field.cover")}</Label>
          <CoverImageUpload
            onUploaded={setFileKey}
            changeLabel={t("plats.editPhoto")}
            emptyLabel={t("upload.hint")}
          />
        </div>

        {/* Essential info */}
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            {t("restaurants.section.info")}
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="name">
              {t("restaurants.field.nameEstab")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="name"
                id="name"
                placeholder="e.g. Artisto food"
                className={`pl-9 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                aria-invalid={!!errors.name}
                onChange={() => errors.name && setErrors((e) => ({ ...e, name: undefined }))}
              />
            </div>
            {errors.name ? <p className="text-xs text-red-500">{errors.name}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="adresse">
              {t("restaurants.field.addressReq")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="adresse"
                id="adresse"
                placeholder="e.g. Rue de Paris, France"
                className={`pl-9 ${errors.adresse ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                aria-invalid={!!errors.adresse}
                onChange={() => errors.adresse && setErrors((e) => ({ ...e, adresse: undefined }))}
              />
            </div>
            {errors.adresse ? <p className="text-xs text-red-500">{errors.adresse}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tel">
              {t("restaurants.field.phoneReq")} <span className="text-red-500">*</span>
            </Label>
            <div className={errors.phone ? "rounded-lg ring-1 ring-red-500" : ""}>
              <PhoneInput
                value={phoneNumber}
                onChange={(v) => {
                  setPhoneNumber(v);
                  if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                }}
                placeholder={t("restaurants.field.phonePlaceholder")}
              />
            </div>
            {errors.phone ? <p className="text-xs text-red-500">{errors.phone}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subdomain">{t("restaurants.field.subdomain")}</Label>
            <div className="flex">
              <Input id="subdomain" name="subdomain" placeholder="artisto" className="rounded-e-none" />
              <span className="inline-flex items-center rounded-e-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
                .{getRootDomain()}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
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
          <div className="grid gap-2">
            <Label htmlFor="wifi">{t("restaurants.field.wifi")}</Label>
            <div className="relative">
              <Wifi className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="wifi" id="wifi" placeholder="e.g. wifi-pass" className="pl-9" />
            </div>
          </div>
        </div>

        {/* Presence & links */}
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            {t("restaurants.section.presence")}
          </p>
          <div className="grid gap-2">
            <Label htmlFor="website">{t("restaurants.field.website")}</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="website" id="website" placeholder="www.example.com" className="pl-9" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="instagram">{t("restaurants.field.instagram")}</Label>
            <div className="relative">
              <Instagram className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="instagram" id="instagram" placeholder="artisto" className="pl-9" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tiktok">{t("restaurants.field.tiktok")}</Label>
            <div className="relative">
              <Music2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="tiktok" id="tiktok" placeholder="@artisto" className="pl-9" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="google">{t("restaurants.field.google")}</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="google" id="google" placeholder="https://g.page/..." className="pl-9" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer submit */}
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

export default RestoDrawerDialogDemo;
