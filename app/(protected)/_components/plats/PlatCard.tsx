import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GripVertical, Trash, CopyPlus, Pencil, ListPlus } from "lucide-react";
import { toast } from "sonner";
import { getS3Url } from "@/lib/s3";
import CoverImageUpload from "@/components/CoverImageUpload";
import { useOrderingEnabled } from "@/hooks/use-workspace-role";
import { DishAddonsDialog } from "./DishAddonsDialog";
import { useI18n } from "@/lib/i18n";

interface DishCardProps {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  price: string;
  /** Raw numeric price, used to prefill the edit form. */
  priceValue?: number;
  /** Raw photo key (S3 file_key), used to prefill/edit the dish image. */
  photoValue?: string | null;
  allergenes: string;
  state?: "ACTIVE" | "INACTIVE";
  /** Currency symbol for the add-ons price hint (display only). */
  currencySymbol?: string;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleState?: (id: string, state: "ACTIVE" | "INACTIVE") => void;
  onEdit?: (id: string) => void;
  onChanged?: () => void;
  /** Props (attributes + listeners) to wire the grip as a drag handle. */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

const DishCard: React.FC<DishCardProps> = ({
  id,
  imageUrl,
  name,
  description,
  price,
  priceValue,
  photoValue,
  allergenes,
  state = "ACTIVE",
  currencySymbol = "€",
  onDelete,
  onDuplicate,
  onToggleState,
  onEdit,
  onChanged,
  dragHandleProps,
}) => {
  const { t } = useI18n();
  const orderingEnabled = useOrderingEnabled();
  const [status, setStatus] = useState(state === "ACTIVE");
  const [editOpen, setEditOpen] = useState(false);
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description);
  const [editPrice, setEditPrice] = useState<number>(priceValue ?? 0);
  const [editErrors, setEditErrors] = useState<{ name?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);
  // Photo editing (BUG-6): keep the current S3 key so the edit modal shows the
  // existing image, and only send `photo` in the PUT when the owner picks a new
  // one. `editPhotoUrl` is the resolved display URL (empty for the local
  // placeholder fallback).
  const [editPhotoKey, setEditPhotoKey] = useState<string | null>(photoValue ?? null);

  // Local placeholder shown when a dish has no real photo.
  const PLACEHOLDER = "/images/plat-placeholder.svg";
  // The legacy server-side default S3 key used when no photo was picked; it
  // doesn't resolve to a real image, so treat it as "no photo".
  const DEFAULT_PHOTO_KEY = "uploads/1735415131028bg-food.jpg";

  // Resolve a display URL for a dish image source: real S3 keys (`uploads/...`)
  // go through getS3Url; empty/missing/default-key values fall back to the local
  // placeholder so a dish without a photo never renders a broken image.
  const resolveImageSrc = (src?: string | null) => {
    if (!src || src === DEFAULT_PHOTO_KEY) return PLACEHOLDER;
    if (src.startsWith("uploads/")) {
      const url = getS3Url(src);
      return url || PLACEHOLDER;
    }
    return src;
  };
  const editPhotoUrl =
    editPhotoKey && editPhotoKey !== DEFAULT_PHOTO_KEY
      ? resolveImageSrc(editPhotoKey)
      : "";

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/plat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete dish");

      toast.success(t("plats.toast.deleted"));
      onDelete?.(id);
      onChanged?.();
    } catch (error) {
      console.error("Failed to delete dish", error);
      toast.error(t("plats.toast.deleteError"));
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch("/api/plat/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platId: id }),
      });

      if (!response.ok) throw new Error("Failed to duplicate dish");

      toast.success(t("plats.toast.duplicated"));
      onDuplicate?.(id);
      onChanged?.();
    } catch (error) {
      console.error("Failed to duplicate dish", error);
      toast.error(t("plats.toast.duplicateError"));
    }
  };

  const handleToggle = async (checked: boolean) => {
    setStatus(checked);
    const newState = checked ? "ACTIVE" : "INACTIVE";
    try {
      const response = await fetch("/api/plat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, state: newState }),
      });

      if (!response.ok) throw new Error("Failed to update dish status");

      toast.success(checked ? t("plats.toast.stateActive") : t("plats.toast.stateInactive"));
      onToggleState?.(id, newState);
    } catch (error) {
      console.error("Failed to update dish status", error);
      setStatus(!checked);
      toast.error(t("plats.toast.stateError"));
    }
  };

  const handleEdit = () => {
    setEditName(name);
    setEditDescription(description);
    setEditPrice(priceValue ?? 0);
    setEditPhotoKey(photoValue ?? null);
    setEditErrors({});
    setEditOpen(true);
    onEdit?.(id);
  };

  const handleSaveEdit = async () => {
    const nextErrors: { name?: string; price?: string } = {};
    if (!editName.trim()) nextErrors.name = t("plats.nameRequired");
    if (!(editPrice > 0)) nextErrors.price = t("validation.pricePositive");
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      const response = await fetch("/api/plat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          description: editDescription,
          price: editPrice,
          // Only send the photo key when set, so an unchanged dish keeps its
          // existing image (PUT /api/plat updates `photo` only when provided).
          ...(editPhotoKey ? { photo: editPhotoKey } : {}),
        }),
      });
      if (!response.ok) throw new Error("Failed to update dish");
      toast.success(t("plats.toast.updated"));
      setEditOpen(false);
      onChanged?.();
    } catch (error) {
      console.error("Failed to update dish", error);
      toast.error(t("plats.toast.updateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-row rounded-xl border border-border bg-card p-4 shadow-none transition-colors duration-200 hover:border-yellow-400/60">
      {/* Dish Content (Name, Description, Price) */}
      <div className="flex flex-col justify-between flex-1">
        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>
            <button
              type="button"
              aria-label="Déplacer le plat"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-inherit cursor-grab active:cursor-grabbing touch-none"
              {...dragHandleProps}
            >
              <GripVertical className="flex my-auto text-muted-foreground" />
            </button>
          </div>

          <div className="flex justify-end items-center space-x-2">
            <Switch checked={status} onCheckedChange={handleToggle} />

            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-red-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-red-500 hover:bg-red-200"
                    onClick={handleDelete}
                  >
                    <Trash />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("plats.tooltip.delete")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-muted-foreground bg-inherit shadow-none rounded-full opacity-80 hover:text-foreground hover:bg-muted"
                    onClick={handleDuplicate}
                  >
                    <CopyPlus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("plats.tooltip.duplicate")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-muted-foreground bg-inherit shadow-none rounded-full opacity-80 hover:text-foreground hover:bg-muted"
                    onClick={handleEdit}
                  >
                    <Pencil />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("plats.tooltip.edit")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Add-ons (FEAT-1/D12) — only relevant when the account takes
                orders, so it's hidden unless ordering is enabled. */}
            {orderingEnabled ? (
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger>
                    <Button
                      size="icon"
                      className="text-muted-foreground bg-inherit shadow-none rounded-full opacity-80 hover:text-foreground hover:bg-muted"
                      onClick={() => setAddonsOpen(true)}
                    >
                      <ListPlus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("plats.tooltip.addons")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        </div>
        <div className="flex-shrink-0">

        <div className="w-24 h-24 justify-center">
        <img
          src={resolveImageSrc(imageUrl)}
          alt={name}
          className="w-full h-full rounded-xl border border-border object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.endsWith(PLACEHOLDER)) return;
            img.src = PLACEHOLDER;
          }}
        />
      </div> </div>
        {/* Dish Info */}
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-lg font-semibold text-foreground">{name}</p>
            <p className="font-serif-display shrink-0 text-xl font-medium tracking-tight text-foreground">
              {price}
            </p>
          </div>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
          {allergenes ? (
            <p className="mt-1 text-xs text-muted-foreground">{allergenes}</p>
          ) : null}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[480px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
              {t("plats.edit.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-2">
              <Label>{t("plats.field.photo")}</Label>
              <CoverImageUpload
                initialUrl={editPhotoUrl || null}
                onUploaded={setEditPhotoKey}
                changeLabel={t("plats.editPhoto")}
                emptyLabel={t("upload.hint")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`dish-name-${id}`}>{t("plats.field.name")} <span className="text-red-500">*</span></Label>
              <Input
                id={`dish-name-${id}`}
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (editErrors.name) setEditErrors((er) => ({ ...er, name: undefined }));
                }}
                aria-invalid={!!editErrors.name}
                className={editErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="Plat du jour"
              />
              {editErrors.name ? <p className="text-xs text-red-500">{editErrors.name}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`dish-desc-${id}`}>{t("plats.field.description")}</Label>
              <Textarea
                id={`dish-desc-${id}`}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Un plat oriental"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`dish-price-${id}`}>{t("plats.field.price")} <span className="text-red-500">*</span></Label>
              <Input
                id={`dish-price-${id}`}
                type="number"
                min={0}
                step="0.01"
                value={editPrice}
                onChange={(e) => {
                  setEditPrice(parseFloat(e.target.value) || 0);
                  if (editErrors.price) setEditErrors((er) => ({ ...er, price: undefined }));
                }}
                aria-invalid={!!editErrors.price}
                className={editErrors.price ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="0.00"
              />
              {editErrors.price ? <p className="text-xs text-red-500">{editErrors.price}</p> : null}
            </div>
          </div>
          <div className="border-t border-border px-6 py-4">
            <Button
              className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
              onClick={handleSaveEdit}
              disabled={saving}
            >
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add-ons management dialog (mounted only when ordering is enabled) */}
      {orderingEnabled ? (
        <DishAddonsDialog
          dishId={id}
          dishName={name}
          open={addonsOpen}
          onOpenChange={setAddonsOpen}
          currencySymbol={currencySymbol}
        />
      ) : null}
    </div>
  );
};

export default DishCard;
