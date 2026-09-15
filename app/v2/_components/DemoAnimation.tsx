import { cn } from '@/lib/utils';

interface DemoAnimationProps {
  /** Path to the animated demo SVG under /public (e.g. /images/demos/menu.svg). */
  src: string;
  /** Accessible label describing the demonstrated action. */
  alt: string;
  /** Optional caption shown under the frame. */
  caption?: string;
  className?: string;
}

/**
 * A framed, animated product demo — a browser-chrome window wrapping one of the
 * animated demo SVGs (a mock app view with a moving/clicking cursor). Reusable
 * across landing sections and anywhere a short "watch the flow" visual helps.
 *
 * Uses a plain <img> (not next/image) so the SVG's SMIL animation runs.
 */
export default function DemoAnimation({
  src,
  alt,
  caption,
  className
}: DemoAnimationProps) {
  return (
    <figure className={cn('w-full', className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          <span className="ml-3 hidden truncate rounded-md bg-background px-3 py-0.5 text-[11px] text-muted-foreground sm:block">
            app.mangeqr.com
          </span>
        </div>
        {/* Animated demo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="block w-full" loading="lazy" />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
