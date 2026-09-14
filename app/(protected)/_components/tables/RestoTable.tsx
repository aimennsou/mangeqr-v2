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
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
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

  import { useEffect, useState } from "react";
  import { getS3Url } from "@/lib/s3";
  import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogTrigger
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




  
  
  export function RestoTable({ restaurants }: { restaurants: Restaurant[] }) {
    const { t } = useI18n();







 const columns: ColumnDef<Restaurant>[] = [
  
    {
      id: "select",
      
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Tout sélectionner"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Sélectionner la ligne"
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
      accessorKey:"adresse",
      header:  t("restaurants.col.address"),
      cell: ({ row }) => <div >{row.original.address}</div>,  },
      {
        accessorKey: "telephone",
        enableSorting: false,
        header: t("restaurants.col.phone"),
        cell: ({ row }) => <div>{row.original.phone}</div>,  },
        {
          accessorKey: "wifi",
          enableSorting: false,
          header: t("diner.wifi"),
          cell: ({ row }) => (
            <div>
              {row.original.wifi ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>{t("common.added")}</span>
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">{t("common.pending")}</span>
</Badge>
              )}
            </div>
          ),
        },
        {
          accessorKey: "website",
          enableSorting: false,
          header: t("restaurants.col.website"),
          cell: ({ row }) => (
            <div>
              {row.original.website ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>{t("common.added")}</span>
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">{t("common.pending")}</span>
</Badge>
              )}
            </div>
          ),
        },
        {
          accessorKey: "instagram",
          enableSorting: false,
          header: t("diner.instagram"),
          cell: ({ row }) => (
            <div>
              {row.original.instagram ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>{t("common.added")}</span>
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">{t("common.pending")}</span>
</Badge>
              )}
            </div>
          ),
        },
        {
          accessorKey: "tiktok",
          enableSorting: false,
          header: t("diner.tiktok"),
          cell: ({ row }) => (
            <div>
              {row.original.tiktok ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>{t("common.added")}</span>
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">{t("common.pending")}</span>
</Badge>
              )}
            </div>
          ),
        },
        

        {
            accessorKey: "google",
            enableSorting: false,
            header: t("restaurants.col.google"),
            cell: ({ row }) => (
              <div>
              {row.original.google ? (
                <Badge
                  className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400"
                >
                  <span>{t("common.added")}</span>
                </Badge>
              ) : (
                <Badge
                  className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400"
                >
<span className="whitespace-nowrap">{t("common.pending")}</span>
</Badge>
              )}
            </div>
            ),
        },
     
        {
          accessorKey: "photo",
          enableSorting: false,
          header: t("restaurants.col.cover"),
          cell: ({ row }) => (
            <div>
              {row.original.coverPhoto === "uploads/LOGO.png" ? (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">{t("common.pending")}</span>
</Badge>
              ) : (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>{t("common.added")}</span>
                </Badge>
              )}
            </div>
          ),
        },
        
        {
          id: "actions",
          enableSorting: false,
          header: t("restaurants.col.edit"),
          enableHiding: false,
          cell: ({ row }) => {
      
            const Restophoto = getS3Url(row.original.coverPhoto!);
            const [newPhoto, setNewPhoto] = useState<string | ArrayBuffer | null>(Restophoto);
            const [dialogOpen, setDialogOpen] = useState(false);
            const [editData, setEditData] = useState(row.original);
            const [isSubmitting, setIsSubmitting] = useState(false);
        






            
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Check if the click occurred outside the delete confirmation modal
    const target = e.target as HTMLDivElement;
  
      // Adjust the duration of the animation
 
    if (target.classList.contains('inset-0')) {
     
      setDialogOpen(false)
    }
    
  };
            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const { name, value } = e.target;
              setEditData((prevState) => ({ ...prevState, [name]: value }));
            };
        
            const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const response = await fetch('/api/magasin', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editData),
                });
                if (!response.ok) throw new Error('Failed to update shop');



                setRestaurants(prevRestaurants =>
                  prevRestaurants.map(restaurant =>
                    restaurant.id === editData.id 
                      ? { ...restaurant, ...editData } // Ensure correct structure and shallow merge
                      : restaurant
                  )
                );
                




                toast.success(t("restaurants.toast.updated"));
              } catch (error) {
                toast.error(t("restaurants.toast.updateError"));
              } finally {
                setIsSubmitting(false);
              }
              setIsSubmitting(false);
              setDialogOpen(false);
            };
            
        
            return (
              <>
                        <Dialog>
      <DialogTrigger asChild>
     
      <Button    size="icon" className="text-gray-400  bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200">
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
                initialUrl={(newPhoto as string) || null}
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
                <Label htmlFor="name">
                  {t("restaurants.field.name")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" name="name" value={editData.name} onChange={handleInputChange} className="pl-9" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">
                  {t("restaurants.field.address")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="address" name="address" value={editData.address} onChange={handleInputChange} className="pl-9" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">
                  {t("restaurants.field.phone")} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="phone" name="phone" value={editData.phone} onChange={handleInputChange} className="pl-9" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wifi">{t("restaurants.field.wifi")}</Label>
                <div className="relative">
                  <Wifi className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="wifi" name="wifi" value={editData.wifi ?? ""} onChange={handleInputChange} className="pl-9" />
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
                  <Input id="website" name="website" value={editData.website ?? ""} onChange={handleInputChange} className="pl-9" placeholder="www.example.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instagram">{t("restaurants.field.instagram")}</Label>
                <div className="relative">
                  <Instagram className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="instagram" name="instagram" value={editData.instagram ?? ""} onChange={handleInputChange} className="pl-9" placeholder="artisto" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tiktok">{t("restaurants.field.tiktok")}</Label>
                <div className="relative">
                  <Music2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="tiktok" name="tiktok" value={editData.tiktok ?? ""} onChange={handleInputChange} className="pl-9" placeholder="@artisto" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="google">{t("restaurants.field.google")}</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="google" name="google" value={editData.google ?? ""} onChange={handleInputChange} className="pl-9" placeholder="https://g.page/..." />
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


      
        
                {/* Modal content */}
  
              </>
            );
          },
        },
        
];

  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<any>({});
  const [restaurantz, setRestaurants] = useState<Restaurant[]>(restaurants);







  
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
  












  useEffect(() => {
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
    










      
      return (
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder={t("restaurants.search")}
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event: { target: { value: any; }; }) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <div className="ml-auto gap-2 flex flex-row">
            <AlertDialog >
      <AlertDialogTrigger>
    
      <Button variant="outline"   className="text-red-400 bg-inherit  border-none shadow-none  rounded-full hover:bg-inherit hover:text-red-500" >
          
    
    
       {t("common.delete")}
    
    
    
    
      </Button>
    
    
      </AlertDialogTrigger>
      <AlertDialogContent >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmDeleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
          
    
    
          {t("restaurants.delete.desc")}    
    
    
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end  items-center">
          <AlertDialogCancel  className="border-none bg-muted text-foreground my-auto mr-2 hover:bg-muted/80 shadow-none">
            
            {t("common.cancel")}
            
          </AlertDialogCancel>
          <AlertDialogAction  onClick={handleDeleteRestaurant}                     className="bg-red-50 border border-red-500 shadow-none text-red-500 hover:bg-red-100"
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
                       "cursor-pointer": header.column.getCanSort(), // only enable sorting if sorting is allowed
                     })}
                     onClick={() => {
                       if (header.column.getCanSort()) {
                         header.column.toggleSorting()
                       }
                     }}
                   >
                     {header.isPlaceholder
                       ? null
                       : flexRender(
                           header.column.columnDef.header,
                           header.getContext()
                         )}
                     {header.column.getIsSorted() === "asc" ? (
                       <ChevronUpIcon className="flex w-4 h-4 my-auto text-gray-400 ml-2" />
                     ) : header.column.getIsSorted() === "desc" ? (
                       <ChevronDownIcon className="flex w-4 h-4 my-auto text-gray-400 ml-2" />
                     ) : null}
                   </div>
                 </TableHead>
                 
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table!.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
    
    
    
    
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-gray-500  text-center">
                      Aucun résultat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      );
    }
  export default RestoTable;
  
