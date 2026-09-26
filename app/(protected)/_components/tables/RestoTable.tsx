"use client";

import {
  Pencil,
  ChevronUpIcon,
  ChevronDownIcon,
  Globe,
  Instagram,
  MapPin,
  Music2,
  Phone,
  Store,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { getS3Url } from "@/lib/s3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Restaurant } from "@/types";
import CoverImageUpload from "@/components/CoverImageUpload";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

/**
 * Small presentational helper: the "Ajouté / En attente" pill used by most columns.
 */
function FilledBadge({ filled, label }: { filled: boolean; label: string }) {
  return (
    <div>
      <Badge
        className={
          filled
            ? "bg-green-200 border border-green-700 text-green-700 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400"
            : "bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-gray-400"
        }
      >
        <span className="whitespace-nowrap">{label}</span>
      </Badge>
    </div>
  );
}

/**
 * The edit dialog for a single row.
 *
 * This MUST stay a top-level component. It previously lived inline inside the
 * "actions" column's `cell` render function, which called five useState hooks
 * from there — a react-hooks/rules-of-hooks violation. TanStack invokes `cell`
 * in a stable order per render so it mostly worked, but the hook state is keyed
 * by call order, not by row, so adding, removing, reordering or sorting rows
 * could attach one row's draft edits to a different row.
 *
 * Defining it inside RestoTable instead would be just as wrong for a different
 * reason: it would be a new component type on every parent render, so React
 * would unmount and remount it and the open dialog would lose its state.
 */
function RestoRowActions({
  restaurant,
  onUpdated,
}: {
  restaurant: Restaurant;
  onUpdated: (updated: Restaurant) => void;
}) {
  const { t } = useI18n();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newPhoto, setNewPhoto] = React.useState<string | null>(
    restaurant.coverPhoto ? getS3Url(restaurant.coverPhoto) : null
  );
  const [editData, setEditData] = React.useState<Restaurant>(restaurant);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editErrors, setEditErrors] = React.useState<{
    name?: string;
    address?: string;
    phone?: string;
  }>({});

  // Reset the draft from the source row whenever the dialog is opened, so a
  // cancelled edit is not still sitting there the next time it is opened.
  // Done here rather than in an effect so it cannot fire mid-edit if the
  // parent refetches while the dialog is open.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setEditData(restaurant);
      setNewPhoto(restaurant.coverPhoto ? getS3Url(restaurant.coverPhoto) : null);
      setEditErrors({});
    }
    setDialogOpen(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prevState) => ({ ...prevState, [name]: value }));
    if (editErrors[name as keyof typeof editErrors]) {
      setEditErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Inline required-field validation.
    const nextErrors: { name?: string; address?: string; phone?: string } = {};
    if (!String(editData.name ?? "").trim()) nextErrors.name = t("validation.required");
    if (!String(editData.address ?? "").trim()) nextErrors.address = t("validation.required");
    if (!String(editData.phone ?? "").trim()) nextErrors.phone = t("validation.required");
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const sel = nextErrors.name ? "#name" : nextErrors.address ? "#address" : "#phone";
      const el = (e.currentTarget as HTMLFormElement).querySelector<HTMLElement>(sel);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/magasin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!response.ok) throw new Error("Failed to update shop");

      onUpdated(editData);
      toast.success(t("restaurants.toast.updated"));
      // Only close on success — on failure the draft stays open so the edit
      // is not silently lost.
      setDialogOpen(false);
    } catch (error) {
      toast.error(t("restaurants.toast.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Field ids are scoped per row so two dialogs can never share a label target.
  const fid = (name: string) => `${name}-${restaurant.id}`;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          aria-label={t("restaurants.col.edit")}
          className="text-gray-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200"
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
            {t("restaurants.edit.title")}
          </DialogTitle>
          <DialogDescription>{t("restaurants.edit.desc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-8rem)] flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Cover photo — focal element at the top */}
            <div className="space-y-2">
              <Label>{t("restaurants.field.cover")}</Label>
              <CoverImageUpload
                initialUrl={newPhoto}
                onUploaded={(fileKey) => {
                  setNewPhoto(getS3Url(fileKey));
                  setEditData((prev) => ({ ...prev, coverPhoto: fileKey }));
                }}
                changeLabel={t("plats.editPhoto")}
                emptyLabel={t("upload.hint")}
              />
            </div>

            {/* Essential info */}
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                {t("restaurants.section.info")}
              </p>
              <div className="grid gap-2">
                <Label htmlFor={fid("name")}>
                  {t("restaurants.field.name")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("name")}
                    name="name"
                    value={editData.name}
                    onChange={handleInputChange}
                    aria-invalid={!!editErrors.name}
                    className={`pl-9 ${
                      editErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                  />
                </div>
                {editErrors.name ? (
                  <p className="text-xs text-red-500">{editErrors.name}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={fid("address")}>
                  {t("restaurants.field.address")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("address")}
                    name="address"
                    value={editData.address}
                    onChange={handleInputChange}
                    aria-invalid={!!editErrors.address}
                    className={`pl-9 ${
                      editErrors.address ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                  />
                </div>
                {editErrors.address ? (
                  <p className="text-xs text-red-500">{editErrors.address}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={fid("phone")}>
                  {t("restaurants.field.phone")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("phone")}
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    aria-invalid={!!editErrors.phone}
                    className={`pl-9 ${
                      editErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                  />
                </div>
                {editErrors.phone ? (
                  <p className="text-xs text-red-500">{editErrors.phone}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={fid("wifi")}>{t("restaurants.field.wifi")}</Label>
                <div className="relative">
                  <Wifi className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("wifi")}
                    name="wifi"
                    value={editData.wifi ?? ""}
                    onChange={handleInputChange}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Presence & links */}
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                {t("restaurants.section.presence")}
              </p>
              <div className="grid gap-2">
                <Label htmlFor={fid("website")}>{t("restaurants.field.website")}</Label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("website")}
                    name="website"
                    value={editData.website ?? ""}
                    onChange={handleInputChange}
                    className="pl-9"
                    placeholder="www.example.com"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={fid("instagram")}>{t("restaurants.field.instagram")}</Label>
                <div className="relative">
                  <Instagram className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("instagram")}
                    name="instagram"
                    value={editData.instagram ?? ""}
                    onChange={handleInputChange}
                    className="pl-9"
                    placeholder="artisto"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={fid("tiktok")}>{t("restaurants.field.tiktok")}</Label>
                <div className="relative">
                  <Music2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("tiktok")}
                    name="tiktok"
                    value={editData.tiktok ?? ""}
                    onChange={handleInputChange}
                    className="pl-9"
                    placeholder="@artisto"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={fid("google")}>{t("restaurants.field.google")}</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={fid("google")}
                    name="google"
                    value={editData.google ?? ""}
                    onChange={handleInputChange}
                    className="pl-9"
                    placeholder="https://g.page/..."
                  />
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
      </DialogContent>
    </Dialog>
  );
}

export function RestoTable({ restaurants }: { restaurants: Restaurant[] }) {
  const { t } = useI18n();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<any>({});
  const [restaurantz, setRestaurants] = React.useState<Restaurant[]>(restaurants);

  const handleRowUpdated = React.useCallback((updated: Restaurant) => {
    setRestaurants((prev) =>
      prev.map((restaurant) =>
        restaurant.id === updated.id ? { ...restaurant, ...updated } : restaurant
      )
    );
  }, []);

  const columns = React.useMemo<ColumnDef<Restaurant>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t("table.selectAll")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: any) => row.toggleSelected(!!value)}
            aria-label={t("table.selectRow")}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: t("common.restaurant"),
        cell: ({ row }) => <div>{row.original.name}</div>,
      },
      {
        accessorKey: "adresse",
        header: t("restaurants.col.address"),
        cell: ({ row }) => <div>{row.original.address}</div>,
      },
      {
        accessorKey: "telephone",
        enableSorting: false,
        header: t("restaurants.col.phone"),
        cell: ({ row }) => <div>{row.original.phone}</div>,
      },
      {
        accessorKey: "wifi",
        enableSorting: false,
        header: t("diner.wifi"),
        cell: ({ row }) => (
          <FilledBadge
            filled={!!row.original.wifi}
            label={row.original.wifi ? t("common.added") : t("common.pending")}
          />
        ),
      },
      {
        accessorKey: "website",
        enableSorting: false,
        header: t("restaurants.col.website"),
        cell: ({ row }) => (
          <FilledBadge
            filled={!!row.original.website}
            label={row.original.website ? t("common.added") : t("common.pending")}
          />
        ),
      },
      {
        accessorKey: "instagram",
        enableSorting: false,
        header: t("diner.instagram"),
        cell: ({ row }) => (
          <FilledBadge
            filled={!!row.original.instagram}
            label={row.original.instagram ? t("common.added") : t("common.pending")}
          />
        ),
      },
      {
        accessorKey: "tiktok",
        enableSorting: false,
        header: t("diner.tiktok"),
        cell: ({ row }) => (
          <FilledBadge
            filled={!!row.original.tiktok}
            label={row.original.tiktok ? t("common.added") : t("common.pending")}
          />
        ),
      },
      {
        accessorKey: "google",
        enableSorting: false,
        header: t("restaurants.col.google"),
        cell: ({ row }) => (
          <FilledBadge
            filled={!!row.original.google}
            label={row.original.google ? t("common.added") : t("common.pending")}
          />
        ),
      },
      {
        accessorKey: "photo",
        enableSorting: false,
        header: t("restaurants.col.cover"),
        cell: ({ row }) => {
          // "uploads/LOGO.png" is the seeded placeholder, i.e. no real cover yet.
          const hasCover = row.original.coverPhoto !== "uploads/LOGO.png";
          return (
            <FilledBadge
              filled={hasCover}
              label={hasCover ? t("common.added") : t("common.pending")}
            />
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: t("restaurants.col.edit"),
        enableHiding: false,
        cell: ({ row }) => (
          <RestoRowActions restaurant={row.original} onUpdated={handleRowUpdated} />
        ),
      },
    ],
    [t, handleRowUpdated]
  );

  const handleDeleteRestaurant = async () => {
    const selectedRestaurantIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => restaurantz[parseInt(key)].id);

    if (selectedRestaurantIds.length === 0) {
      toast.error(t("restaurants.delete.selectError"));
      return;
    }

    try {
      const response = await fetch("/api/magasin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedRestaurantIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete menus");
      }

      setRestaurants((prevRestaurants) =>
        prevRestaurants.filter((restaurant) => !selectedRestaurantIds.includes(restaurant.id))
      );

      toast.success(t("restaurants.toast.deleted"));
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting menus:", error);
      toast.error(t("restaurants.toast.deleteError"));
    }
  };

  React.useEffect(() => {
    // Keep the table in sync when the parent refetches / adds a restaurant
    setRestaurants(restaurants);
  }, [restaurants]);

  const table = useReactTable({
    data: restaurantz,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder={t("restaurants.search")}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event: { target: { value: any } }) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ms-auto gap-2 flex flex-row">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-400 bg-inherit border-none shadow-none rounded-full hover:bg-inherit hover:text-red-500"
              >
                {t("common.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("common.confirmDeleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("restaurants.delete.desc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row justify-end items-center">
                <AlertDialogCancel className="border-none bg-muted text-foreground my-auto me-2 hover:bg-muted/80 shadow-none">
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteRestaurant}
                  className="bg-red-50 border border-red-500 shadow-none text-red-500 hover:bg-red-100"
                >
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div
                      className={cn("flex", {
                        "cursor-pointer": header.column.getCanSort(),
                      })}
                      onClick={() => {
                        if (header.column.getCanSort()) {
                          header.column.toggleSorting();
                        }
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? (
                        <ChevronUpIcon className="flex w-4 h-4 my-auto text-gray-400 ms-2" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ChevronDownIcon className="flex w-4 h-4 my-auto text-gray-400 ms-2" />
                      ) : null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-gray-500 text-center"
                >
                  {t("table.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {t("table.rowsSelected")
            .replace("{selected}", String(selectedCount))
            .replace("{total}", String(totalCount))}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("table.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("table.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
export default RestoTable;
