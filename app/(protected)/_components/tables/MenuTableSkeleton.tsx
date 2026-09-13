import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// Column labels mirror MenuTable so the skeleton header lines up with the
// eventual table. The leading `null` is the row-select checkbox column.
const COLUMNS: (string | null)[] = [
  null,
  "Menu",
  "Restaurant",
  "Jours de disponibilités",
  "Nombre de Catégories",
  "Nombre de Plats",
  "Statut",
  "Dupliquer",
  "Modifier",
];

/**
 * Pulsating placeholder that reproduces the MenuTable layout (toolbar,
 * 9-column header, several rows, and footer) while menus load.
 */
export default function MenuTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="w-full">
      {/* Toolbar: search field on the left, delete action on the right. */}
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((label, i) => (
                <TableHead key={i}>
                  {label === null ? (
                    <Skeleton className="h-4 w-4 rounded-sm" />
                  ) : (
                    <Skeleton className="h-4 w-24" />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* select checkbox */}
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded-sm" />
                </TableCell>
                {/* Menu name */}
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {/* Restaurant name */}
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                {/* Jours de disponibilités: a row of day badges. */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 4 }).map((__, i) => (
                      <Skeleton key={i} className="h-6 w-14 rounded-full" />
                    ))}
                  </div>
                </TableCell>
                {/* Nombre de Catégories badge */}
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                {/* Nombre de Plats */}
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                {/* Statut toggle switch */}
                <TableCell>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </TableCell>
                {/* Dupliquer icon */}
                <TableCell>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </TableCell>
                {/* Modifier icon */}
                <TableCell>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer: selection count on the left, pagination on the right. */}
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
