"use client";
import * as React from "react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Coins,
  DollarSign,
  Euro,
  Globe,
  Instagram,
  Loader2,
  MapPin,
  Music2,
  Pencil,
  Phone,
  Store,
  Upload,
  Wifi,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadToS3 } from "@/lib/s3";
import { getRootDomain } from "@/lib/subdomain";
import { useI18n } from "@/lib/i18n";

interface DrawerDialogDemoProps {
  onAddRestaurant: (newRestaurant: any) => void;
}

/**
 * Cover-photo field styled like the edit dialog: a framed rounded box that is a
 * drop zone when empty, and shows the uploaded image with a hover "change"
 * overlay once a photo is picked. Uploads to S3 and reports the file key up.
 */
function CoverPhotoField({
  onUploaded,
  changeLabel
}: {
  onUploaded: (fileKey: string) => void;
  changeLabel: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { getRootProps, getInputProps, open } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    maxFiles: 1,
    noClick: !!preview, // once we have a preview, only the overlay button opens the picker
    onDrop: async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Fichier trop volumineux");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key) {
          toast.error("Merci de réessayer");
          return;
        }
        onUploaded(data.file_key);
        toast.success("Votre image a été transmise avec succès !");
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
      }
    }
  });

  return (
    <div
      {...getRootProps({
        className:
          "group relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition-colors hover:border-yellow-400/60 focus:outline-none"
      })}
    >
      <input {...getInputProps()} />
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            title={changeLabel}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium text-white opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100"
          >
            <Pencil className="h-4 w-4" /> {changeLabel}
          </button>
          {uploading ? (
            <span className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </span>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span>
            Déposez votre image ici, ou cliquez pour sélectionner
            <span className="block text-xs opacity-70">.jpg · .jpeg · .png</span>
          </span>
        </div>
      )}
    </div>
  );
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
    <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-8rem)] flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {/* Cover photo — focal element at the top */}
        <div className="space-y-2">
          <Label>{t("restaurants.field.cover")}</Label>
          <CoverPhotoField onUploaded={setFileKey} changeLabel={t("plats.editPhoto")} />
        </div>

        {/* Essential info */}
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            {t("restaurants.section.info")}
          </p>
          <div className="grid gap-2">
            <Label htmlFor="name">
              {t("restaurants.field.nameEstab")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="name" id="name" placeholder="e.g. Artisto food" className="pl-9" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="adresse">
              {t("restaurants.field.addressReq")} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="adresse" id="adresse" placeholder="e.g. Rue de Paris, France" className="pl-9" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tel">
              {t("restaurants.field.phoneReq")} <span className="text-red-500">*</span>
            </Label>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder={t("restaurants.field.phonePlaceholder")}
            />
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
