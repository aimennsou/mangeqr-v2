import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// Column labels mirror ReviewTable so the skeleton header lines up.
const COLUMNS = ["Client", "Note", "Message", "Restaurant", "Source"];

/**
 * Pulsating placeholder for the WHOLE reviews page while it loads: the
 * top restaurant selector, the shareable-badge card, and the reviews table
 * (toolbar, 5-column header, rows, footer). Mirrors the real page so the
 * loading state doesn't just show a bare table under an empty top area.
 */
export default function ReviewTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-8">
      {/* Editorial header: title + subtitle left, selector right */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[260px]" />
      </div>

      {/* Shareable badge card */}
      <div className="rounded-xl border border-border p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-[160px] w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Toolbar: search field on the left, source filter on the right. */}
      <div className="flex items-center justify-between gap-2 py-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((label) => (
                <TableHead key={label}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* Client */}
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                {/* Note — five star placeholders */}
                <TableCell>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((__, i) => (
                      <Skeleton key={i} className="h-4 w-4 rounded-sm" />
                    ))}
                  </div>
                </TableCell>
                {/* Message */}
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                {/* Restaurant */}
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {/* Source — pill badge */}
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer: pagination buttons. */}
      <div className="flex items-center justify-end gap-2 py-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
