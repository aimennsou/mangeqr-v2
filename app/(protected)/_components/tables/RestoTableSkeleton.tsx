import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// Column labels mirror RestoTable so the skeleton header lines up with the
// eventual table. The leading `null` is the row-select checkbox column.
const COLUMNS: (string | null)[] = [
  null,
  "Restaurant",
  "Adresse",
  "Téléphone",
  "Wifi",
  "Site web",
  "Instagram",
  "Tiktok",
  "Compte google",
  "Photo bannière",
  "Mon lien",
  "Mon QR Code",
  "Modifier",
];

/**
 * Pulsating placeholder that reproduces the RestoTable layout (toolbar,
 * 13-column header, several rows, and footer) while restaurants load.
 */
export default function RestoTableSkeleton({ rows = 4 }: { rows?: number }) {
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
                    <Skeleton className="h-4 w-20" />
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
                {/* Restaurant name (two short lines) */}
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {/* Adresse */}
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {/* Téléphone */}
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {/* Wifi / Site web / Instagram / Tiktok / Compte google:
                    pill-shaped status badges. */}
                {Array.from({ length: 5 }).map((__, i) => (
                  <TableCell key={i}>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                ))}
                {/* Photo bannière badge */}
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                {/* Mon lien (share icon) */}
                <TableCell>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </TableCell>
                {/* Mon QR Code (download icon) */}
                <TableCell>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </TableCell>
                {/* Modifier (edit icon) */}
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
