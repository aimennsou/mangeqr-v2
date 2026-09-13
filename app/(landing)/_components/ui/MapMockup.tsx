import { Navigation, Phone, Star, MapPin } from "lucide-react";

// CSS/SVG-rendered stylized Google-Maps-style card: cream map with smooth
// curved roads, a location pin, a "Propulsé par MangeQR" pill, and a business
// card overlay with rating + action buttons. No map SDK or image assets.
export default function MapMockup() {
  return (
    <div className="relative w-full">
      {/* Hard offset shadow behind the card (matches the reference's depth). */}
      <div className="absolute inset-0 translate-x-2 translate-y-3 rounded-[1.75rem] bg-neutral-900/90" />

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-neutral-300 bg-[#f3f0e9]">
        {/* Map roads (SVG for smooth curves) */}
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {/* wide light roads */}
          <path
            d="M-10 120 C 90 110, 150 130, 410 100"
            stroke="#ffffff"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-10 200 C 120 205, 220 190, 410 210"
            stroke="#ffffff"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M180 -10 C 190 90, 205 180, 190 310"
            stroke="#ffffff"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M300 -10 C 305 80, 290 180, 310 310"
            stroke="#ffffff"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* City blocks */}
        <div className="absolute left-[10%] top-[20%] h-9 w-11 rounded-[3px] border border-neutral-300/80" />
        <div className="absolute left-[11%] top-[35%] h-7 w-9 rounded-[3px] border border-neutral-300/80" />
        <div className="absolute left-[62%] top-[18%] h-8 w-10 rounded-[3px] border border-neutral-300/80" />

        {/* Green park */}
        <div className="absolute bottom-[24%] right-[8%] h-24 w-28 rounded-[45%] border-2 border-dashed border-emerald-400/50 bg-emerald-300/30" />

        {/* "Propulsé par" pill */}
        <div className="font-serif-display absolute right-4 top-4 rounded-full bg-yellow-400 px-4 py-1.5 text-sm italic text-black shadow-md">
          Propulsé par MangeQR
        </div>

        {/* Location pin (teardrop) */}
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full rounded-bl-none rotate-45 bg-red-500 shadow-lg">
            <MapPin className="h-5 w-5 -rotate-45 text-white" />
          </div>
        </div>

        {/* Business card overlay */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-red-500 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white">
              CARTE
            </span>
            <span className="flex h-full w-full items-center justify-center text-3xl">
              🍝
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-serif-display truncate text-lg leading-tight text-neutral-900">
              Le Bon Plat
            </p>
            <div className="mt-0.5 flex items-center gap-1 text-xs">
              <span className="font-bold text-neutral-800">4.8</span>
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </span>
              <span className="text-neutral-400">(1 264)</span>
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              €€ · Italien · Ouvre à 12h00
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                <Navigation className="h-3 w-3" /> Itinéraire
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-2.5 py-1 text-[10px] font-semibold text-neutral-700">
                <Phone className="h-3 w-3" /> Appeler
              </span>
              <span className="relative inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white">
                Carte
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-400 ring-2 ring-white" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
