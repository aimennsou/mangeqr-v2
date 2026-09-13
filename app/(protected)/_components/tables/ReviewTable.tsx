"use client"

import * as React from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


import { QrCode, Star, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";



export type Review = {
  id: string;  
  client: string; 
  review: any;
  message: string,  
  state: string;  
  shop: {  
    id: string;
    name: string;
  } ;  
};






// Clickable column header that toggles sorting (none → asc → desc) and shows
// the current direction with an arrow.
function SortableHeader({
  column,
  label,
}: {
  column: Column<Review, unknown>;
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

export function ReviewTable({ reviews }: { reviews: Review[] }) {

    const { t } = useI18n();

    const columns: ColumnDef<Review>[] = [
    
        {
          accessorKey: "client",
          header: t("reviews.column.client"),
          cell: ({ row }) => <div>{row.getValue("client")}</div>,
        },
        {
            accessorKey: "review",
            header: ({ column }) => (
              <SortableHeader column={column} label={t("reviews.column.rating")} />
            ),
            cell: ({ row }) => {
              const review = Number(row.getValue("review")) || 0;
              return (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={
                        i <= review
                          ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                          : "h-4 w-4 text-gray-300"
                      }
                    />
                  ))}
                </div>
              );
            },
          },
        {
          accessorKey: "message",
          header: t("reviews.column.message"),
          cell: ({ row }) => <div>{row.getValue("message")}</div>,
        },
        {
          accessorKey: "shop.name",
          header: ({ column }) => (
            <SortableHeader column={column} label={t("common.restaurant")} />
          ),
          cell: ({ row }) => <div>{row.original.shop.name}</div>, // Ensure shop relationship is correct in your schema
        },
        {
            accessorKey: "state",
            header: ({ column }) => (
              <SortableHeader column={column} label={t("reviews.column.source")} />
            ),
            cell: ({ row }) => {
              const state = row.getValue("state") as string;
        
              // Conditional rendering of the source with a text label.
              return (
                <div className="flex items-center">
                  {state === "MANGEQR" ? (
                    <Badge className="gap-1 bg-yellow-100 border border-yellow-400 text-yellow-700 hover:bg-yellow-100">
                      <QrCode className="h-4 w-4 text-yellow-500" />
                      MangeQR
                    </Badge>
                  ) : state === "GOOGLE" ? (
                    <Badge variant="outline" className="gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 48 48">
                        <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        <path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                        <path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                        <path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                      </svg>
                      Google
                    </Badge>
                  ) : null}
                </div>
              );
            },
          },
      ];
      
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<any>({});


  const table = useReactTable({
    data: reviews,
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
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder={t("reviews.searchPlaceholder")}
          value={(table.getColumn("client")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("client")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto">
          <Select
            value={(table.getColumn("state")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(value) =>
              table
                .getColumn("state")
                ?.setFilterValue(value === "ALL" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("reviews.column.source")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("reviews.filter.allSources")}</SelectItem>
              <SelectItem value="MANGEQR">{t("reviews.source.mangeqr")}</SelectItem>
              <SelectItem value="GOOGLE">{t("reviews.source.google")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                <TableCell colSpan={columns.length} className="h-24 text-muted-foreground  text-center">
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
     
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

export default ReviewTable;
