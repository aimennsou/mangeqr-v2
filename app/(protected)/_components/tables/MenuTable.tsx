"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
    numberOfCategories?: number; // Added as per suggestion
    numberOfDishes?: number;     // Added as per suggestion
  };
  numberOfCategories?: number; // Added as per suggestion
  numberOfDishes?: number;     // Added as per suggestion
};

interface Category {
  id: string;
  name: string;
  icon: string;
  menuId: string; // Ensure this exists for filtering
}

interface Dish {
  id: string;
  name: string;
  category: {
    menuId: string;
  }
}


export function MenuTable({ menus: initialMenus }: { menus: Menu[] }) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus); 
  const [shops, setShops] = useState<{ id: string; name: string }[]>(
    initialMenus.map((menu) => menu.shop)
  );
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);




  const updateMenuPositions = async (newOrder: any[]) => {
    try {
      const updatedMenus = newOrder.map((menuId: string, index: number) => ({
        menuId,
        position: index + 1, // Position starts from 1
      }));
  
      // Call your backend API to update the positions
      await fetch("/api/menu/positions", {
        method: "POST",
        body: JSON.stringify(updatedMenus),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      // Optionally, you can handle any success or error state here
    } catch (error) {
      console.error("Error updating menu positions:", error);
    }
  };




  
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
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      enableSorting: true,
      header: "Menu",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "shopName",
      enableSorting: true,
      header: "Restaurant",
      cell: ({ row }) => <div>{row.original.shop.name}</div>,
    },
    {
      accessorKey: "availability",
      enableSorting: false,
      header: "Jours de disponibilités",
      cell: ({ row }) => {
        const availability = row.getValue("availability") as string[];
        return (
          <div style={{ display: "flex", gap: "8px" }}>
            {availability.map((item, index) => (
              <Badge
                key={index}
                className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300 "
              >
                <span>{item}</span>
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "numberOfCategories",
      enableSorting: false,
      header: "Nombre de Catégories",
      cell: ({ row }) => {
        const count = menuCategoryCounts[row.original.id] || 0;
        return (
          <Badge variant="secondary">
         <span className="whitespace-nowrap">     {count} catégorie{count !== 1 ? "s" : ""}</span> 
          </Badge>
        );
      },
    },
    
    {
      accessorKey: "numberOfDishes",
      enableSorting: false,
      header: "Nombre de Plats",
      cell: ({ row }) => {
        const count = menuDishCounts[row.original.id] || 0;

        return (
          <Badge variant="secondary">
     <span className="whitespace-nowrap"> {count} plat{count !== 1 ? "s" : ""}</span>      
          </Badge>
        );
      },
    },
    {
      accessorKey: "state",
      enableSorting: false,
      header: "Statut",
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
            toast.success({
 
     
         description: `Le menu est maintenant ${
                checked ? "ACTIVE" : "INACTIVE"
              }.`,
            } );
         

             // Update the menus state to reflect the change immediately
            setMenus(prevMenus =>
              prevMenus.map(menu =>
                menu.id === row.original.id ? { ...menu, state: checked ? "ACTIVE" : "INACTIVE" } : menu
              )
            );


          } catch (error) {
            console.error("Failed to update menu status", error);
            setStatus(!checked);
            toast({
              title: "Erreur",
              description: "Échec de la mise à jour du statut du menu.",
              variant: "destructive",
            });
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
      header: "Dupliquer",
      cell: ({ row }) => {
        const { toast } = useToast();

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

            if (!response.ok) {
              throw new Error("Failed to duplicate menu");
            }

            const result = await response.json(); //result now contains menu, categories, and dishes

            // Update allCategories and allDishes *first*
            setAllCategories(prevCategories => [...prevCategories, ...result.categories]);
            setAllDishes(prevDishes => [...prevDishes, ...result.dishes]);


            setMenus(menus => [...menus, result.menu]); 




            toast({
              title: "Menu Dupliqué",
              description: `Le menu a été dupliqué avec succès.`,
            });
          } catch (error) {
            console.error("Failed to duplicate menu", error);
            toast({
              title: "Erreur",
              description: "Limite de menus atteinte.",
              
            });
          }
        };

        return (
          <Button
            size="icon"
            className="text-gray-400 bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200"
            onClick={handleDuplicate}
          >
            <CopyPlus />
          </Button>
        );
      },
    },

    {
      id: "actions",
      header: "Modifier",
      enableHiding: false,
      cell: ({ row }) => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [editData, setEditData] = useState<Menu>(row.original); // Type the state
        const [isSubmitting, setIsSubmitting] = useState(false);
        const { toast } = useToast();


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
                ...editData,
                shopId: editData.shop.id,
              }),
            });

            if (!response.ok) throw new Error("Failed to update shop");

            // Update the local `menus` state with the updated `editData`
            setMenus(prevMenus =>
              prevMenus.map(menu =>
                menu.id === editData.id ? { ...menu, ...editData, shop: {...menu.shop, ...editData.shop} } : menu // Ensure deep merge for shop
              )
            );

            toast({
              title: "Succès",
              description: "Menu mis à jour avec succès!",
            });

          } catch (error) {
            toast({
              title: "Erreur",
        
              description: "Erreur lors de la mise à jour",
            });
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

        const handleBackgroundClick = (
          e: React.MouseEvent<HTMLDivElement, MouseEvent>
        ) => {
          const target = e.target as HTMLDivElement;
          if (target.classList.contains("inset-0")) {
            setDialogOpen(false);
          }
        };

        return (
          <>
            <Button
              onClick={() => setDialogOpen(true)}
              size="icon"
              className="text-gray-400  bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200"
            >
              <Pencil />
            </Button>

            {dialogOpen && (
              <div
                onClick={handleBackgroundClick}
                className="fixed  flex justify-center items-center inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
              >
                <div className="bg-white sm:max-w-md rounded-lg overflow-hidden shadow-lg">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">
                      Modifier votre menu
                    </h2>
                    <p className="text-sm text-gray-500">
                      Modifiez les détails de votre menu ici.
                    </p>
                  </div>

                  <div className="max-h-[600px] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                      <div className="m-4">
                        <Label htmlFor="name">
                          Name<span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          value={editData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border rounded-md p-2"
                          required
                        />
                      </div>
                      <div className="m-4">
                        <Label htmlFor="shopName">
                          Restaurant<span className="text-red-500">*</span>
                        </Label>

                        <Select
                            onValueChange={(value) =>
                              setEditData((prevState) => ({
                                ...prevState,
                                shop: { ...prevState.shop, id: value },
                              }))
                            }
                            value={editData.shop.id}
                          >









                            
                            <SelectTrigger className="w-full border my-4">
                              <SelectValue
                                placeholder={
                                  editData.shop
                                    ? shops.find(
                                        (shop) => shop.id === editData.shop.id
                                      )?.name || "Restaurant" : "Loading..." //handle case where shop might be undefined initially
                                }
                              />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Mes restaurants</SelectLabel>

                                {shops.map((shop) => (
                                  <SelectItem
                                    key={shop.id}
                                    value={shop.id}
                                  >
                                    {shop.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                      </div>
                      <div className="m-4">
                        <Label htmlFor="availablility">
                          Disponibilités<span className="text-red-500">*</span>
                        </Label>

                        <ToggleGroup
                          size={"lg"}
                          type="multiple"
                          className="grid grid-cols-3"
                          value={editData.availability}
                          onValueChange={(values) =>
                            handleAvailabilityChange(values)
                          }
                        >
                          <ToggleGroupItem
                            value="Dimanche"
                            aria-label="Toggle Dimanche"
                          >
                            Dimanche
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="Lundi"
                            aria-label="Toggle Lundi"
                          >
                            Lundi
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="Mardi"
                            aria-label="Toggle Mardi"
                          >
                            Mardi
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="Mercredi"
                            aria-label="Toggle Mercredi"
                          >
                            Mercredi
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="Jeudi"
                            aria-label="Toggle Jeudi"
                          >
                            Jeudi
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="Vendredi"
                            aria-label="Toggle Vendredi"
                          >
                            Vendredi
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="Samedi"
                            aria-label="Toggle Samedi"
                          >
                            Samedi
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      <div className="flex w-full p-4 ">
                        <Button
                          className="bg-yellow-400 hover:bg-yellow-400 text-black"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                        'Enregistrement'
                          ) : (
                            "Enregistrer"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="flex justify-start p-4 border-t">
                    <Button
                      variant="secondary"
                      onClick={() => setDialogOpen(false)}
                      className="text-gray-500"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      },
    },
    {
      id: "drag",
      cell: () => (
        <div className="flex justify-end">
          <SortableDragHandle variant="ghost" size="icon" className="size-8">
          <GripVertical className="flex my-auto text-gray-300" />
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
      toast({
        title: "Pas de selection.",
       
        description: "Merci de selectionné les menus a supprimé",
      });
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

      toast({
        title: "Menu supprimé.",
        description: "Votre menu est supprimé",
      });
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
          placeholder="Trouver un menu..."
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
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Elle supprimera
                  définitivement votre menu, ainsi que toutes les catégories et
                  les plats associés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row justify-end  items-center">
                <AlertDialogCancel className="border-none bg-gray-100 my-auto mr-2 hover:text-black shadow-none">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMenu}
                  className="bg-red-50 border border-red-500 shadow-none text-red-500 hover:bg-red-100"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="rounded-md border">
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
          <Sortable
  value={menus}
  onValueChange={(newOrder: any[] | ((prevState: Menu[]) => Menu[])) => {
   
    // Extract the menu IDs and send updated positions
  // Extract `id` from each Menu object
  
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </Sortable>
          </TableBody>


        
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
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

export default MenuTable;