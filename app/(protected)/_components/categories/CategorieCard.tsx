import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Trash, CopyPlus, Pencil, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner"; // Import Sonner's toast function

const ICON_OPTIONS = ["🍽️", "🥗", "🍕", "🍔", "🍰", "🥤", "🍷", "🍜", "🌮", "🍤"];

interface CategoryCardProps {
  id: string;
  logo: React.ReactNode; // For custom icon/logo rendering
  /** Raw logo/emoji string, used to prefill the edit form. */
  logoValue?: string | null;
  name: string;
  dishCount: number;
  state?: "ACTIVE" | "INACTIVE";
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleState?: (id: string, state: "ACTIVE" | "INACTIVE") => void;
  onEdit?: (id: string) => void;
  onChanged?: () => void;
  /** Props (attributes + listeners) to wire the grip as a drag handle. */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  /**
   * When true, render without the card's own border/shadow/rounding so an
   * outer container can act as the single frame (category-as-container layout).
   */
  bare?: boolean;
  /** Optional element rendered in the header action row (e.g. "Ajouter un plat"). */
  headerAction?: React.ReactNode;
  /**
   * Collapsible support (IMPROVEMENT-5). When `collapsible` is true, a chevron
   * toggle is rendered before the drag handle; `collapsed` controls its
   * rotation and `onToggleCollapse` is fired on click. The caller owns the
   * collapse state and decides whether to render the dish body.
   */
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  logo,
  logoValue,
  name,
  dishCount,
  state = "ACTIVE",
  onDelete,
  onDuplicate,
  onToggleState,
  onEdit,
  onChanged,
  dragHandleProps,
  bare = false,
  headerAction,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { t } = useI18n();
  const [status, setStatus] = useState(state === "ACTIVE");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editIcon, setEditIcon] = useState(logoValue || "🍽️");
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/categorie", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete category");

      toast.success(t("categories.toast.deleted"));
      onDelete?.(id);
      onChanged?.();
    } catch (error) {
      console.error("Failed to delete category", error);
      toast.error(t("categories.toast.deleteError"));
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch("/api/categorie/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: id }),
      });

      if (!response.ok) throw new Error("Failed to duplicate category");

      toast.success(t("categories.toast.duplicated"));
      onDuplicate?.(id);
      onChanged?.();
    } catch (error) {
      console.error("Failed to duplicate category", error);
      toast.error(t("categories.toast.duplicateError"));
    }
  };

  const handleToggle = async (checked: boolean) => {
    setStatus(checked);
    const newState = checked ? "ACTIVE" : "INACTIVE";
    try {
      const response = await fetch("/api/categorie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, state: newState }),
      });

      if (!response.ok) throw new Error("Failed to update category status");

      toast.success(checked ? t("categories.toast.stateActive") : t("categories.toast.stateInactive"));
      onToggleState?.(id, newState);
    } catch (error) {
      console.error("Failed to update category status", error);
      setStatus(!checked);
      toast.error(t("categories.toast.stateError"));
    }
  };

  const handleEdit = () => {
    // Prefill with current values and open the edit dialog.
    setEditName(name);
    setEditIcon(logoValue || "🍽️");
    setEditOpen(true);
    onEdit?.(id);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error(t("categories.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/categorie", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName.trim(), logo: editIcon }),
      });
      if (!response.ok) throw new Error("Failed to update category");
      toast.success(t("categories.toast.updated"));
      setEditOpen(false);
      onChanged?.();
    } catch (error) {
      console.error("Failed to update category", error);
      toast.error(t("categories.toast.updateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        bare
          ? "p-4 w-full"
          : "w-full rounded-xl border border-border bg-card p-4 shadow-none transition-colors duration-200 hover:border-yellow-400/60"
      }
    >
      <div className="flex flex-col md:flex-row justify-between gap-8 w-full">
        <div className="flex w-full justify-start items-center space-x-2">
          {/* Collapse chevron (IMPROVEMENT-5) — toggles the dish body. Collapsed
              by default; rotates 90° when expanded. */}
          {collapsible ? (
            <button
              type="button"
              aria-label={collapsed ? "Développer la catégorie" : "Réduire la catégorie"}
              aria-expanded={!collapsed}
              onClick={onToggleCollapse}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-inherit hover:bg-muted"
            >
              <ChevronRight
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  !collapsed && "rotate-90"
                )}
              />
            </button>
          ) : null}

          {/* Drag Handle */}
          <button
            type="button"
            aria-label="Déplacer la catégorie"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-inherit cursor-grab active:cursor-grabbing touch-none"
            {...dragHandleProps}
          >
            <GripVertical className="text-muted-foreground" />
          </button>

          {/* Logo and Name */}
          <div className="flex mr-auto items-center space-x-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-xl">
              {logo}
            </span>
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-foreground md:max-w-[300px] max-w-[150px]">
              {name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center space-x-2">
          {headerAction}
          <Badge
            variant="outline"
            className="shrink-0 whitespace-nowrap tabular-nums text-muted-foreground"
          >
            {dishCount} {t("categories.dishCount")}
          </Badge>
          <Switch checked={status} onCheckedChange={handleToggle} />

          <div className="flex space-x-2">
            {/* Delete Button */}
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-red-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-red-500 hover:bg-red-200"
                    onClick={handleDelete} // Trigger delete
                  >
                    <Trash />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("categories.tooltip.delete")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Duplicate Button */}
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-muted-foreground bg-inherit shadow-none rounded-full opacity-80 hover:text-foreground hover:bg-muted"
                    onClick={handleDuplicate} // Trigger duplicate
                  >
                    <CopyPlus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("categories.tooltip.duplicate")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Edit Button */}
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <Button
                    size="icon"
                    className="text-muted-foreground bg-inherit shadow-none rounded-full opacity-80 hover:text-foreground hover:bg-muted"
                    onClick={handleEdit} // Trigger edit
                  >
                    <Pencil />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("categories.tooltip.edit")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[480px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
              {t("categories.edit.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 px-6 py-5">
            {/* Icon focal element */}
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-yellow-400/10 text-3xl">
                {editIcon}
              </span>
              <div className="grid flex-1 gap-2">
                <Label htmlFor={`cat-icon-${id}`}>{t("categories.field.icon")}</Label>
                <Select value={editIcon} onValueChange={setEditIcon}>
                  <SelectTrigger id={`cat-icon-${id}`}>
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
              <Label htmlFor={`cat-name-${id}`}>
                {t("categories.field.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`cat-name-${id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t("categories.namePlaceholder")}
              />
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
    </div>
  );
};

export default CategoryCard;
