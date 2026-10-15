import type { PhysicalMenuData } from "./types";

// Bold modern look: dark header band, sans-serif, yellow accents (matching the
// MangeQR brand). Two-column category layout.
//
// PRINT-SAFE (BUG-8): replaced the old CSS `columnCount: 2` multi-column flow —
// which fragments columns across pages unpredictably — with a two-column CSS
// GRID. Each category is a self-contained grid item with break-inside: avoid,
// so a category is kept whole and the browser moves the next one to the next
// page instead of tearing a continuous column. Root is width:100% /
// max-width:210mm / no min-height so it fills the printable box and sizes to
// content.
export function ModerneTemplate({ data }: { data: PhysicalMenuData }) {
  const priceFmt = (p: number) =>
    Number.isInteger(p) ? p.toString() : p.toFixed(2);

  return (
    <div
      className="menu-sheet"
      style={{
        fontFamily: "Helvetica, Arial, sans-serif",
        color: "#1a1a1a",
        background: "#fff",
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Header — ink on paper (prints reliably with or without background
          graphics). A bold amber accent bar under the title carries the modern
          identity without a full dark band that vanishes when print backgrounds
          are off. */}
      <header
        style={{
          padding: "10mm 12mm 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#b8860b", marginBottom: 6 }}>
            {data.menuName}
          </div>
          <h1 style={{ fontSize: 36, margin: 0, fontWeight: 800, letterSpacing: -1, color: "#111827" }}>
            {data.restaurantName}
          </h1>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>
          {data.address ? <div>{data.address}</div> : null}
          {data.phone ? <div>{data.phone}</div> : null}
          {data.website ? <div>{data.website}</div> : null}
        </div>
      </header>
      <div style={{ height: 4, background: "#facc15", margin: "10px 12mm 0", borderRadius: 2 }} />

      {/* Categories: print-safe two-column grid. */}
      <main
        style={{
          padding: "10mm 12mm",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 32,
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
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 1,
                margin: "0 0 12px",
                paddingBottom: 6,
                borderBottom: "3px solid #facc15",
                breakAfter: "avoid",
              }}
            >
              {cat.name}
            </h2>

            {cat.dishes.map((dish) => (
              <div key={dish.id} className="dish-row" style={{ marginBottom: 12, breakInside: "avoid" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{dish.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#b45309", whiteSpace: "nowrap" }}>
                    {priceFmt(dish.price)} {data.currencySymbol}
                  </span>
                </div>
                {dish.description ? (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#4b5563" }}>
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
    </div>
  );
}
