import { cn } from "@/lib/utils";

/**
 * Pulsating placeholder block. Uses the theme's muted color and `animate-pulse`
 * so loading states read as a shimmering skeleton of the eventual content.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
