import { cn } from '@/lib/utils';

/**
 * Pure-CSS previews of the physical QR-code supports (poster / wooden disc /
 * table sticker). No image assets — a deterministic CSS-grid QR + gradients.
 * Shared by the owner "Commander un design" section and the public lead funnel.
 */

// A deterministic 7x7 QR-ish matrix (stable pattern, three finder squares).
const QR_CELLS = Array.from({ length: 49 }, (_, i) => {
  const r = Math.floor(i / 7);
  const c = i % 7;
  const finder = (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3);
  if (finder) {
    const rr = r % 4;
    const cc = c % 4;
    return rr === 0 || rr === 2 || cc === 0 || cc === 2;
  }
  return (i * 5 + 2) % 3 === 0;
});

export function QrBlock({
  className,
  cellClass,
  onClass,
  offClass
}: {
  className?: string;
  cellClass?: string;
  onClass: string;
  offClass: string;
}) {
  return (
    <div className={cn('grid grid-cols-7 gap-[2px]', className)}>
      {QR_CELLS.map((on, i) => (
        <span
          key={i}
          className={cn('rounded-[1px]', cellClass, on ? onClass : offClass)}
        />
      ))}
    </div>
  );
}

type Shape = 'poster' | 'disc' | 'sticker' | 'menu-sheet';

/** CSS mockup of a physical QR design for the given shape. */
export function QrDesignPreview({ shape }: { shape: Shape }) {
  if (shape === 'disc') {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center">
        <div
          className="relative flex h-full w-full flex-col items-center justify-center rounded-full p-5 shadow-inner"
          style={{
            background:
              'radial-gradient(circle at 38% 30%, #d9a86a 0%, #c8914e 38%, #a9702f 72%, #8a561f 100%)',
            boxShadow:
              'inset 0 2px 6px rgba(255,236,200,0.45), inset 0 -6px 16px rgba(80,45,15,0.55), 0 2px 8px rgba(80,45,15,0.25)'
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-40 mix-blend-multiply"
            style={{
              background:
                'repeating-radial-gradient(circle at 42% 34%, rgba(120,70,25,0) 0px, rgba(120,70,25,0) 5px, rgba(120,70,25,0.25) 6px, rgba(120,70,25,0) 8px)'
            }}
          />
          <span
            className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{
              background: 'rgba(80,45,15,0.6)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
            }}
          />
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#5a3a17]/90">
            Menu
          </span>
          <QrBlock
            className="my-2 w-[52%]"
            cellClass="aspect-square"
            onClass="bg-[#4a2f13] shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]"
            offClass="bg-transparent"
          />
          <span className="text-[7px] uppercase tracking-widest text-[#5a3a17]/80">
            Scan
          </span>
        </div>
      </div>
    );
  }

  if (shape === 'sticker') {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center p-2">
        <div className="absolute inset-1 rounded-2xl border border-dashed border-red-300" />
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-4 text-white shadow-md">
          <span className="absolute right-0 top-0 h-5 w-5 rounded-bl-2xl rounded-tr-2xl bg-white/25" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
            Scan &amp; Menu
          </span>
          <div className="rounded-md bg-white p-1.5">
            <QrBlock
              className="w-16"
              cellClass="aspect-square"
              onClass="bg-neutral-900"
              offClass="bg-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  // poster / menu-sheet — elegant black & gold poster.
  return (
    <div className="relative flex aspect-[3/4] w-full items-center justify-center">
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-md bg-gradient-to-b from-neutral-900 to-black p-4">
        <div className="pointer-events-none absolute inset-2 rounded-sm border border-amber-300/40" />
        <span className="text-[8px] font-medium uppercase tracking-[0.35em] text-amber-300/80">
          Le Restaurant
        </span>
        <span className="font-serif-display text-lg font-medium leading-none text-amber-200">
          Menu
        </span>
        <span className="h-px w-8 bg-amber-300/50" />
        <div className="rounded-[3px] bg-white p-1.5">
          <QrBlock
            className="w-14"
            cellClass="aspect-square"
            onClass="bg-neutral-900"
            offClass="bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
