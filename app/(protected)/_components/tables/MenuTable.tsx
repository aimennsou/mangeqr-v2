"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon, CopyPlus, GripVertical, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from "@/components/ui/sortable"


import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";


import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { Switch } from "@/components/ui/switch";
import { title } from "process";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export type Menu = {
  position: any;
  id: string;
  name: string;
  shopName?: string;
  availability: string[];
  state: string;
  shop: {
    id: string;
    name: string;
    numberOfCategories?: number; 
    numberOfDishes?: number;     
  };
  numberOfCategories?: number; 
  numberOfDishes?: number;     
};

interface Category {
  id: string;
  name: string;
  icon: string;
  menuId: string; 
}

interface Dish {
  id: string;
  name: string;
  category: {
    menuId: string;
  }
}


export function MenuTable({ menus: initialMenus }: { menus: Menu[] }) {
  const { t } = useI18n();
  const [menus, setMenus] = useState<Menu[]>(initialMenus); 
  const [shops, setShops] = useState<{ id: string; name: string }[]>(
    initialMenus.map((menu) => menu.shop)
  );
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);




  const fetchAllCategories = async () => {
    try {
      const response = await fetch("/api/categorie");
      if (response.ok) {
        const data = await response.json();
        setAllCategories(data);
      } else {
        console.error("Failed to fetch all categories");
      }
    } catch (error) {
      console.error("Error fetching all categories:", error);
    }
  };
  const fetchAllDishes = async () => {
    try {
      const response = await fetch("/api/plat");
      if (response.ok) {
        const data = await response.json();
        setAllDishes(data);
      } else {
        console.error("Failed to fetch all dishes");
      }
    } catch (error) {
      console.error("Error fetching all dishes:", error);
    }
  };

  const uniqueShops = initialMenus.reduce((acc, menu) => {
    // Check if menu.shop is defined before trying to access its id
    if (menu.shop && !acc.find(shop => shop.id === menu.shop.id)) {
      acc.push(menu.shop);
    }
    return acc;
  }, [] as { id: string; name: string }[]);




  useEffect(() => {

    fetchAllCategories();
    fetchAllDishes();
    setMenus(initialMenus);
    setShops(uniqueShops);

    
  }, [initialMenus]);



    const menuCategoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allCategories.forEach(cat => {
            counts[cat.menuId] = (counts[cat.menuId] || 0) + 1;
        });
        return counts;
    }, [allCategories]);

    const menuDishCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      allDishes.forEach(dish => {
          if (dish.category && dish.category.menuId) { // Added check
              counts[dish.category.menuId] = (counts[dish.category.menuId] || 0) + 1;
          } else {
              console.warn("Dish without category or menuId:", dish); // Log the problematic dish
          }
      });
      return counts;
  }, [allDishes]);


  const columns: ColumnDef<Menu>[] = [
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
      enableSorting: true,
      header: t("common.menu"),
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "shopName",
      enableSorting: true,
      header: t("common.restaurant"),
      cell: ({ row }) => <div>{row.original.shop?.name ?? row.original.shopName ?? ""}</div>,
    },
    {
      accessorKey: "availability",
      enableSorting: false,
      header: t("menus.col.availDays"),
      cell: ({ row }) => {
        const availability = row.getValue("availability") as string[];
        return (
          <div style={{ display: "flex", gap: "8px" }}>
            {availability.map((item, index) => (
              <Badge
                key={index}
                className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400 "
              >
                <span>{t(`common.days.${item}` as TranslationKey)}</span>
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "numberOfCategories",
      enableSorting: false,
      header: t("menus.col.categoriesCount"),
      cell: ({ row }) => {
        const count = menuCategoryCounts[row.original.id] || 0;
        return (
          <Badge variant="secondary">
         <span className="whitespace-nowrap">     {count} {t("menus.count.categories")}</span> 
          </Badge>
        );
      },
    },
    
    {
      accessorKey: "numberOfDishes",
      enableSorting: false,
      header: t("menus.col.dishesCount"),
      cell: ({ row }) => {
        const count = menuDishCounts[row.original.id] || 0;

        return (
          <Badge variant="secondary">
     <span className="whitespace-nowrap"> {count} {t("menus.count.dishes")}</span>      
          </Badge>
        );
      },
    },
    {
      accessorKey: "state",
      enableSorting: false,
      header: t("menus.col.state"),
      cell: ({ row }) => {
        const [status, setStatus] = useState(row.getValue("state") === "ACTIVE");
     

        const handleToggle = async (checked: boolean) => {
          setStatus(checked);
          try {
            const response = await fetch(`/api/menu`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: row.original.id,
                state: checked ? "ACTIVE" : "INACTIVE",
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to update menu status");
            }


     

            toast.success(
              checked ? t("menus.toast.stateActive") : t("menus.toast.stateInactive"),
            );
         

             // Update the menus state to reflect the change immediately
            setMenus(prevMenus =>
              prevMenus.map(menu =>
                menu.id === row.original.id ? { ...menu, state: checked ? "ACTIVE" : "INACTIVE" } : menu
              )
            );


          } catch (error) {
            console.error("Failed to update menu status", error);
            setStatus(!checked);


            toast.error(t("menus.toast.stateError")); 

        


          
          }
        };

        return (
          <Switch
            checked={status}
            onCheckedChange={handleToggle}
            id={`menu-status-${row.id}`}
          />
        );
      },
    },
    {
      accessorKey: "state", //  using state, but actual logic is for duplication
      header: t("menus.col.duplicate"),
      cell: ({ row }) => {


        const handleDuplicate = async () => {
          try {
            const response = await fetch(`/api/menu/duplicate`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                menuId: row.original.id,
              }),
            });

            const result = await response.json(); //result now contains menu, categories, and dishes

            if (!response.ok) {
              // Surface the specific server message (e.g. plan limit reached).
              toast.error(result?.error || t("menus.toast.duplicateError"));
              return;
            }

            // Update allCategories and allDishes *first*
            setAllCategories(prevCategories => [...prevCategories, ...result.categories]);
            setAllDishes(prevDishes => [...prevDishes, ...result.dishes]);

            // The API returns the menu with a `restaurant` relation, but the table
            // renders `row.original.shop.name`. Map it to the `shop` shape (falling
            // back to the source row's shop, since a duplicate stays in the same
            // restaurant) so the new row doesn't crash the Restaurant column.
            const duplicatedMenu = {
              ...result.menu,
              shop: result.menu?.restaurant
                ? { id: result.menu.restaurant.id, name: result.menu.restaurant.name }
                : row.original.shop,
              shopName: result.menu?.restaurant?.name ?? row.original.shop?.name ?? "",
            };

            setMenus(menus => [...menus, duplicatedMenu]); 



            toast.success(t("menus.toast.duplicated"));
        



 
          } catch (error) {
            console.error("Failed to duplicate menu", error);
            toast.error(t("menus.toast.duplicateError"));
          }
        };

        return (
          <Button
            size="icon"
            className="text-muted-foreground bg-inherit shadow-none rounded-full opacity-80 hover:text-foreground hover:bg-muted"
            onClick={handleDuplicate}
          >
            <CopyPlus />
          </Button>
        );
      },
    },

    {
      id: "actions",
      header: t("menus.col.edit"),
      enableHiding: false,
      cell: ({ row }) => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [editData, setEditData] = useState<Menu>(row.original); // Type the state
        const [isSubmitting, setIsSubmitting] = useState(false);
      


        useEffect(() => {
            setEditData(row.original);
        }, [row.original]);


        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setIsSubmitting(true);
          try {
            const response = await fetch("/api/menu", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: editData.id,
                name: editData.name,
                availability: editData.availability,
                state: editData.state,
                // The API expects `restaurantId` (not `shopId`) to reassign the
                // menu's parent restaurant — this is what makes the change persist.
                restaurantId: editData.shop.id,
              }),
            });

            if (!response.ok) throw new Error("Failed to update shop");

            // Update the local `menus` state with the updated `editData`.
            // Resolve the NEW restaurant's name from `shops` so the table's
            // Restaurant column reflects the change immediately (previously it
            // kept the old shop.name, requiring a manual refresh).
            const newShop = shops.find((s) => s.id === editData.shop.id);
            setMenus(prevMenus =>
              prevMenus.map(menu =>
                menu.id === editData.id
                  ? {
                      ...menu,
                      ...editData,
                      shop: {
                        ...menu.shop,
                        id: editData.shop.id,
                        name: newShop?.name ?? menu.shop?.name,
                      },
                      shopName: newShop?.name ?? menu.shopName,
                    }
                  : menu
              )
            );




            toast.success(t("menus.toast.updated"));
        
            

      
          } catch (error) {
            toast.error(t("menus.toast.deleteError")); 

          } finally {
            setIsSubmitting(false);
            setDialogOpen(false);
          }
        };

        const handleInputChange = (
          e: React.ChangeEvent<HTMLInputElement>
        ) => {
          const { name, value } = e.target;
          setEditData((prevState) => ({ ...prevState, [name]: value }));
        };

        const handleAvailabilityChange = (values: string[]) => {
          setEditData((prevState) => ({
            ...prevState,
            availability: values,
          }));
        };

        return (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
              onClick={() => setDialogOpen(true)}
              size="icon"
              className="text-muted-foreground bg-inherit shadow-none rounded-full opacity-80 hover:text-foreground hover:bg-muted"
            >
              <Pencil />
            </Button>

            {/* Same shadcn Dialog as the Add form → same fade/zoom animation. */}
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("menus.edit.title")}</DialogTitle>
                <DialogDescription>
                  {t("menus.create.desc")}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[400px] max-w-full overflow-y-auto p-4">
                    <form className={cn("grid items-start gap-4")} onSubmit={handleSubmit}>
                      <div className="grid gap-2">
                        <Label htmlFor="name">{t("menus.field.name")}</Label>
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          placeholder="e.g. Menu du jour"
                          value={editData.name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <Label htmlFor="restaurant">{t("common.restaurant")}</Label>
                      <Select
                        value={editData.shop.id}
                        onValueChange={(value) =>
                          setEditData((prevState) => ({
                            ...prevState,
                            shop: { ...prevState.shop, id: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            className="text-foreground"
                            placeholder={t("common.chooseRestaurant")}
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

                      <Label htmlFor="availability">{t("menus.field.availability")}</Label>
                      <ToggleGroup
                        size="lg"
                        type="multiple"
                        className="grid grid-cols-3"
                        value={editData.availability}
                        onValueChange={(values) => handleAvailabilityChange(values)}
                      >
                        {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map(
                          (day) => (
                            <ToggleGroupItem key={day} value={day} aria-label={`Toggle ${day}`}>
                              {t(`common.days.${day}` as TranslationKey)}
                            </ToggleGroupItem>
                          )
                        )}
                      </ToggleGroup>

                      <Button
                        className="bg-yellow-400 hover:bg-yellow-400 text-black"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t("common.saving") : t("common.save")}
                      </Button>
                    </form>
                  </div>
            </DialogContent>
          </Dialog>
        );
      },
    },
    {
      id: "drag",
      cell: () => (
        <div className="flex justify-end">
          <SortableDragHandle variant="ghost" size="icon" className="size-8">
          <GripVertical className="flex my-auto text-muted-foreground" />
          </SortableDragHandle>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<any>({});


  const handleDeleteMenu = async () => {
    const selectedMenuIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => menus[parseInt(key)].id);

    if (selectedMenuIds.length === 0) {

      toast.error(t("menus.delete.selectError")); 

 
      return;
    }






    try {
      const response = await fetch("/api/menu", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedMenuIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete menus");
      }

      setMenus((menus) =>
        menus.filter((menu) => !selectedMenuIds.includes(menu.id))
      );


      toast.success(t("menus.toast.deleted")); 

  

 
      
      
      setRowSelection({});
    } catch (error) {
      console.error("Error deleting menus:", error);
    }
  };

  const table = useReactTable({
    data: menus, // Use the state variable 'menus'
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

  const sendMenuPositions = async (menus: string[]) => {
    try {
      const updatedMenus = menus.map((menuId, index) => ({
        menuId,
        position: index + 1, // Positions start at 1
      }));
  
      await fetch("/api/menu/position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedMenus),
      });
  
      console.log("Menu positions updated successfully:", updatedMenus);
    } catch (error) {
      console.error("Error updating menu positions:", error);
    }
  };
  


  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder={t("menus.search")}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto gap-2 flex flex-row">
          <AlertDialog>
            <AlertDialogTrigger>
              <Button
                variant="outline"
                className="text-red-400 bg-inherit  border-none shadow-none  rounded-full hover:bg-inherit hover:text-red-500"
              >
                {t("common.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("common.confirmDeleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("menus.delete.desc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row justify-end  items-center">
                <AlertDialogCancel className="border-none bg-muted text-foreground my-auto mr-2 hover:bg-muted/80 shadow-none">
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMenu}
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
                     <ChevronUpIcon className="flex w-4 h-4 my-auto text-muted-foreground ml-2" />
                   ) : header.column.getIsSorted() === "desc" ? (
                     <ChevronDownIcon className="flex w-4 h-4 my-auto text-muted-foreground ml-2" />
                   ) : null}
                 </div>
               </TableHead>
               
                ))}
              </TableRow>
            ))}
          </TableHeader>


          <TableBody>
          <Sortable
  value={menus}
  onValueChange={(newOrder) => {
    // Update local state so the UI reflects the new order immediately
    setMenus(newOrder);

    // Persist the new order to the backend as [{ menuId, position }]
    sendMenuPositions(newOrder.map((menu) => menu.id));
  }}
  overlay={
    <Table>
      <TableBody>
        <TableRow>
          <div className="h-12 w-full bg-accent/10" />
        </TableRow>
      </TableBody>
    </Table>
  }
>

              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <SortableItem key={row.id} value={row.original.id} asChild>
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
                  </SortableItem>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t("common.noResults")}
                  </TableCell>
                </TableRow>
              )}
            </Sortable>
          </TableBody>


        
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} {t("menus.rowsOf")}{" "}
          {table.getFilteredRowModel().rows.length} {t("menus.rowsSelected")}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
  
}

export default MenuTable;