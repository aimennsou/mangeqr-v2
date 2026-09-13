import type { PhysicalMenuData } from "./types";

// Chalkboard / bistro slate (inspired by reference #1): dark slate background
// with chalk-dust texture, script-style headings, YELLOW RIBBON category
// labels (a colored bar behind the category name), thin chalk dividers.
//
// PRINT-SAFE (BUG-8): the dark background prints because page.tsx forces
// print-color-adjust: exact on `.menu-print-area *`. Replaced the fragile CSS
// `columnCount: 2` with a two-column CSS GRID whose items (categories) carry
// break-inside: avoid, so columns never tear across pages. Root is width:100%
// / max-width:210mm / no min-height.
export function ArdoiseTemplate({ data }: { data: PhysicalMenuData }) {
  const priceFmt = (p: number) =>
    Number.isInteger(p) ? p.toString() : p.toFixed(2);

  return (
    <div
      className="menu-sheet"
      style={{
        // Subtle chalk-dust texture over dark slate.
        background:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.06), transparent 35%), #1f2530",
        color: "#f5f5f4",
        fontFamily: 'Georgia, "Times New Roman", serif',
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "12mm 12mm",
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        <div
          style={{
            fontFamily: '"Brush Script MT", "Segoe Script", cursive',
            fontSize: 46,
            lineHeight: 1.1,
            color: "#fef3c7",
          }}
        >
          {data.restaurantName}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            margin: "10px auto 0",
            color: "#d6d3d1",
          }}
        >
          <span style={{ flex: "0 0 40px", height: 1, background: "#9ca3af" }} />
          <span style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>
            {data.menuName}
          </span>
          <span style={{ flex: "0 0 40px", height: 1, background: "#9ca3af" }} />
        </div>
      </header>

      {/* Categories: print-safe two-column grid. */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 36,
          rowGap: 4,
          alignItems: "start",
        }}
      >
        {data.categories.map((cat) => (
          <section
            key={cat.id}
            style={{
              breakInside: "avoid",
              marginBottom: 24,
            }}
          >
            {/* Yellow ribbon category label */}
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <span
                style={{
                  display: "inline-block",
                  background: "#f5c518",
                  color: "#1f2530",
                  fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                  fontSize: 24,
                  lineHeight: 1.2,
                  padding: "4px 22px",
                  borderRadius: 3,
                  boxShadow: "0 2px 0 rgba(0,0,0,0.35)",
                }}
              >
                {cat.logo ? `${cat.logo} ` : ""}
                {cat.name}
              </span>
            </div>

            {cat.dishes.map((dish) => (
              <div key={dish.id} className="dish-row" style={{ marginBottom: 12, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#f5f5f4" }}>
                    {dish.name}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fde68a", whiteSpace: "nowrap" }}>
                    {priceFmt(dish.price)} {data.currencySymbol}
                  </span>
                </div>
                {dish.description ? (
                  <p style={{ margin: "2px 0 0", fontSize: 12, fontStyle: "italic", color: "#d1d5db" }}>
                    {dish.description}
                  </p>
                ) : null}
                {dish.allergenes && dish.allergenes.length > 0 ? (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>
                    {dish.allergenes.join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ))}
      </main>

      {(data.address || data.phone) && (
        <footer
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: 11,
            color: "#a8a29e",
            letterSpacing: 1,
          }}
        >
          {[data.address, data.phone].filter(Boolean).join("   ·   ")}
        </footer>
      )}
    </div>
  );
}
