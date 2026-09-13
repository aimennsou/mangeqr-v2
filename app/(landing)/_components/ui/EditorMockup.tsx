import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Tag,
  LayoutGrid,
  Eye,
  QrCode,
  GripVertical,
} from "lucide-react";

// A CSS-rendered mockup of the MangeQR card EDITOR screen (not the diner menu).
// Matches the "Éditeur de la carte" section: Online toggle, reorderable
// categories, and a bottom tab bar. No image assets required.

const CATEGORIES = [
  { name: "Entrées", count: 4 },
  { name: "Plats Principaux", count: 5 },
  { name: "Desserts", count: 4 },
];

export default function EditorMockup() {
  return (
    <div className="flex h-full flex-col bg-[#f4f2ee] text-left text-neutral-800">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-medium text-neutral-500">
        <span>9:41</span>
        <span>●●●</span>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="flex items-center gap-1 text-sm text-neutral-500">
          <ChevronLeft className="h-4 w-4" /> Retour
        </span>
        <span className="text-sm font-semibold">Plats</span>
        <Settings className="h-4 w-4 text-neutral-500" />
      </div>

      {/* Online toggle card */}
      <div className="mx-3 mt-1 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold">En ligne</p>
          <p className="text-[11px] text-neutral-500">Visible par les clients</p>
        </div>
        <span className="flex h-6 w-11 items-center rounded-full bg-yellow-400 p-0.5">
          <span className="ml-auto h-5 w-5 rounded-full bg-white shadow" />
        </span>
      </div>

      {/* Categories */}
      <div className="mt-4 flex items-center justify-between px-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Catégories
        </p>
        <span className="text-[11px] text-neutral-400">≡ Réorganiser</span>
      </div>

      <div className="mt-2 space-y-2 px-3">
        {CATEGORIES.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-neutral-300" />
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <Tag className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{c.name}</p>
              <p className="text-[11px] text-neutral-500">{c.count} articles</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
          </div>
        ))}
      </div>

      {/* Bottom tab bar */}
      <div className="mt-auto flex items-center justify-around border-t border-neutral-200 bg-white px-2 py-2 text-[10px]">
        {[
          { icon: LayoutGrid, label: "Carte" },
          { icon: Tag, label: "Éditeur", active: true },
          { icon: Eye, label: "Aperçu" },
          { icon: QrCode, label: "QR" },
        ].map((t) => (
          <div
            key={t.label}
            className={`flex flex-col items-center gap-0.5 ${
              t.active ? "text-yellow-600" : "text-neutral-400"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}
