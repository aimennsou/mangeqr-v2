import {
     Copy, Download, Pencil, Share2, Check,
     ChevronUpIcon,
     ChevronDownIcon,
     Plus,
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
  import { getS3Url, uploadToS3 } from "@/lib/s3";
  import {
    DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, 
    DropdownMenuSeparator, DropdownMenuTrigger
  } from "@/components/ui/dropdown-menu";
  import {
    Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, 
    DialogTitle, DialogTrigger
  } from "@/components/ui/dialog";

  import * as React from "react";


import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Restaurant } from "@/types";
import { toast } from "sonner";
import RestoDrawerDialogDemo from "../restaurants/CreateRestaurant";



  
  
  export function RestoTable({ restaurants }: { restaurants: Restaurant[] }) {
    const [copied, setCopied] = useState(false);

   
  
  
    const handleCopy = (qrUrl:string) => {
      setCopied(true);
      navigator.clipboard.writeText(qrUrl || "").then(() => {
        toast.success('Lien copié dans le presse-papiers!' );
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        toast.error( err.message );
      });
    };
 
    const handleDownloadPDF = async (qrUrl:string) => {
      try {
        const response = await fetch('/api/download-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
      
            qrUrl,
    
          }),
        });
        if (!response.ok) throw new Error('Failed to download PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'QR-code.pdf';
        link.click();
      } catch (error) {
        console.error('Error downloading PDF:', error);
      }
    };
    
    
      const handleDownloadJPEG = async (qrUrl:string) => {
        try {
          const response = await fetch('/api/download-jpeg', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            
              qrUrl,
              
            }),
          });
          if (!response.ok) throw new Error('Failed to download QR code JPEG');
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'QR-code.jpeg';
          link.click();
        } catch (error) {
          console.error('Error downloading QR code JPEG:', error);
        }
      };







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
      header: "Restaurant",
      cell: ({ row }) => <div>{row.original.name}</div>,
    },
    {
      accessorKey:"adresse",
      header:  "Adresse",
      cell: ({ row }) => <div >{row.original.address}</div>,  },
      {
        accessorKey: "telephone",
        enableSorting: false,
        header: "Téléphone",
        cell: ({ row }) => <div>{row.original.phone}</div>,  },
        {
          accessorKey: "wifi",
          enableSorting: false,
          header: "Wifi",
          cell: ({ row }) => (
            <div>
              {row.original.wifi ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>Ajouté</span> {/* Translates to "Added" */}
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">En attente</span>
</Badge>
              )}
            </div>
          ),
        },
        {
          accessorKey: "website",
          enableSorting: false,
          header: "Site web",
          cell: ({ row }) => (
            <div>
              {row.original.website ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>Ajouté</span>
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">En attente</span>
</Badge>
              )}
            </div>
          ),
        },
        {
          accessorKey: "instagram",
          enableSorting: false,
          header: "Instagram",
          cell: ({ row }) => (
            <div>
              {row.original.instagram ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>Ajouté</span>
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">En attente</span>
</Badge>
              )}
            </div>
          ),
        },
        {
          accessorKey: "tiktok",
          enableSorting: false,
          header: "Tiktok",
          cell: ({ row }) => (
            <div>
              {row.original.tiktok ? (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>Ajouté</span>
                </Badge>
              ) : (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">En attente</span>
</Badge>
              )}
            </div>
          ),
        },
        

        {
            accessorKey: "google",
            enableSorting: false,
            header: "Compte google",
            cell: ({ row }) => (
              <div>
              {row.original.google ? (
                <Badge
                  className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400"
                >
                  <span>Ajouté</span>
                </Badge>
              ) : (
                <Badge
                  className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400"
                >
<span className="whitespace-nowrap">En attente</span>
</Badge>
              )}
            </div>
            ),
        },
     
        {
          accessorKey: "photo",
          enableSorting: false,
          header: "Photo bannière",
          cell: ({ row }) => (
            <div>
              {row.original.coverPhoto === "uploads/LOGO.png" ? (
                <Badge className="bg-gray-200 border border-gray-700 text-gray-700 hover:bg-gray-300    dark:bg-gray-800  dark:hover:bg-gray-900 dark:text-gray-400">
<span className="whitespace-nowrap">En attente</span>
</Badge>
              ) : (
                <Badge className="bg-green-200 border border-green-700 text-green-700 hover:bg-green-300  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400  dark:bg-green-800 dark:hover:bg-green-900 dark:text-green-400">
                  <span>Ajouté</span> {/* Translates to "Added" */}
                </Badge>
              )}
            </div>
          ),
        },
        
        {
            accessorKey: "qrcode",
            enableSorting: false,
            header: "Mon lien",
            cell: ({ row }) => (
                <div>
                    {row.original.qrUrl ? (
                             <Dialog>
                             <DialogTrigger asChild>
                             <Button size="icon" className="text-gray-400  bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200">
                                 <Share2 />
                                 </Button>
                             </DialogTrigger>
                                                       <DialogContent className="max-w-[300px] rounded-md">
                               <DialogHeader className="items-start">
                               <DialogTitle>Partager le lien</DialogTitle>
                       <DialogDescription className="text-start">
                         Toute personne ayant ce lien pourra consulter vos menus.
                       </DialogDescription>
                               </DialogHeader>
                               <div className="flex items-center space-x-2">
                                 <div className="grid flex-1 gap-2">
                                   <Label htmlFor="link" className="sr-only">
                                     Link
                                   </Label>
                                   <Input
                                     id="link"
                                     defaultValue={row.original.qrUrl}
                                     readOnly
                                   />
                                 </div>
                                      <Button onClick={() => handleCopy(row.original.qrUrl!)} size="sm" className="px-3">
                                   <span className="sr-only">Copier</span>
                                   {copied ? (
                               <Check className="h-4 w-4 text-black" />
                             ) : (
                               <Copy className="h-4 w-4 text-black" />
                             )}
                                 </Button>
                               </div>
                               <DialogFooter className="sm:justify-start">
                                 <DialogClose asChild>
                                   <Button type="button" variant="secondary">
                                     Fermer
                                   </Button>
                                 </DialogClose>
                               </DialogFooter>
                             </DialogContent>
                           </Dialog>
                    ) : null}
                </div>
            ),
        },
        
        
      
        
        
        
        {
            accessorKey: "qrcode",
            enableSorting: false,
            header: "Mon QR Code",
            cell: ({ row }) => (
                <div>
                    {row.original.qrUrl ? (
                           <DropdownMenu >
                           <DropdownMenuTrigger asChild>
                             <Button size="icon" className="text-gray-400  bg-inherit shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-200">
                               <Download />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent className="">
                             <DropdownMenuLabel className="">Format de votre QR code</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             <DropdownMenuCheckboxItem className=" hover:bg-muted" onClick={(e:any) => handleDownloadJPEG(row.original.qrUrl!)} >
                               JPEG
                             </DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem className="hover:bg-muted" onClick={(e:any) => handleDownloadPDF(row.original.qrUrl!)} >
                               PDF
                             </DropdownMenuCheckboxItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                    ) : null}
                </div>
            ),
        },
      
        {
          id: "actions",
          enableSorting: false,
          header: "Modifier",
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
        
            const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const { file_key, file_name } = await uploadToS3(file);
                  setNewPhoto(getS3Url(file_key));
                  setEditData((prevData) => ({ ...prevData, coverPhoto: file_key }));
                   toast.success( 'Votre image a été transmise avec succès !'
                      );
                } catch (error) {
                  console.error("Error uploading file: ", error);
                  toast.error( 'Une erreur s\'est produite lors de l\'envoie de fichier' );

                }
              }
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
                




                toast.success('Le restaurant a été mis à jour avec succès.' );
              } catch (error) {
                toast.error( 'Une erreur s\'est produite lors de la mise à jour.');
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
      <DialogContent className="sm:max-w-[425px] "> 
        <DialogHeader>

          <DialogTitle>Modifier votre restaurant</DialogTitle>
          <DialogDescription>
          Modifiez les détails de votre restaurant ici.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-background  overflow-y-auto px-2 rounded-lg overflow-hidden ">

<form onSubmit={handleSubmit} className="max-h-[400px]  ">

   
                        <div className="flex flex-col gap-4 p-4  ">
                        <div className="grid gap-2">
                        <Label htmlFor="name">Nom <span className="text-red-500">*</span></Label>                            <Input
                              type="text"
                              id="name"
                              name="name"
                              value={editData.name}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                              required
                            />
                     
                          <div className="grid gap-2">
                          <Label htmlFor="adresse">Adresse <span className="text-red-500">*</span></Label>
                          <Input
                              type="text"
                              id="address"
                              name="address"
                              value={editData.address}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                          <Label htmlFor="tel">Numéro de téléphone <span className="text-red-500">*</span></Label>
                          <Input
                              type="text"
                              id="phone"
                              name="phone"
                              value={editData.phone}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                          <Label htmlFor="wifi">Mot de passe Wifi</Label>
                          <Input
                              type="text"
                              id="wifi"
                              name="Wifi"
                              value={editData.wifi}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                            />
                          </div>
                          <div className="grid gap-2">
                          <Label htmlFor="website">Votre site web</Label>
                          <Input
                              type="text"
                              id="website"
                              name="Website"
                              value={editData.website}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                            />
                          </div>
                          <div className="grid gap-2">
                          <Label htmlFor="instagram">Compte Instagram</Label>
                          <Input
                              type="text"
                              id="instagram"
                              name="Instagram"
                              value={editData.instagram}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                            />
                          </div>
                          <div className="grid gap-2">
                          <Label htmlFor="tiktok">Compte Tiktok</Label>
                          <Input
                              type="text"
                              id="tiktok"
                              name="Tiktok"
                              value={editData.tiktok}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                            />
                          </div>
                          <div className="grid gap-2">
                          <Label htmlFor="google">Lien profile business Google</Label>
                          <Input
                              type="text"
                              id="google"
                              name="Google"
                              value={editData.google}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border rounded-md p-2"
                            />
                          </div>
                          <div className="grid gap-2">
                          <Label htmlFor="coverPhoto">Photo bannière</Label>
                          {newPhoto && (
                              <div className="relative mt-2">
                                <img src={newPhoto as string} alt="Preview" className="w-full h-48 object-cover rounded-md" />
              
            <Button size="icon"
                                  type="button"
                                  onClick={() => document.getElementById('fileInput')?.click()}
                                  className="text-gray-400 absolute top-2 right-2 bg-gray-200 shadow-none rounded-full opacity-80 hover:text-gray-500 hover:bg-gray-300"
                                >
                                  <Pencil />
                                  </Button>
                              </div>
                            )}
                            <input
                              type="file"
                              id="fileInput"
                              name="coverPhoto"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </div>
                        </div>
        
                        {/* Submit button */}
                      
                        <Button
                  className="bg-yellow-400 hover:bg-yellow-400 text-black"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enregistrement' : "Enregistrer"}
                </Button>
                </div>
                      </form>

                      </div>


        
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
     
     

           toast.error(
             "Merci de selectionné les restaurants a supprimé",
            
    );
  
   
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


      toast.success( 'Votre restaurant est supprimé',
      );
      setRowSelection({});

    } catch (error) {
      console.error("Error deleting menus:", error);
      toast.error(
      "Une erreur est survenue lors de la suppression des restaurants."

     );
    }
  };
  












  useEffect(() => {
    // Fetch user and categories when the component mounts

  }, []); 










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
              placeholder="Trouver un restaurant..."
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
          
    
    
       Supprimer
    
    
    
    
      </Button>
    
    
      </AlertDialogTrigger>
      <AlertDialogContent >
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
          
    
    
          Cette action est irréversible. Elle rendra le lien de menu numérique public obsolète et entraînera la suppression définitive du(des) restaurant(s), ainsi que de leurs menus, catégories et plats.    
    
    
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end  items-center">
          <AlertDialogCancel  className="border-none bg-gray-100 my-auto mr-2 hover:text-black shadow-none">
            
            Annuler
            
          </AlertDialogCancel>
          <AlertDialogAction  onClick={handleDeleteRestaurant}                     className="bg-red-50 border border-red-500 shadow-none text-red-500 hover:bg-red-100"
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
  
