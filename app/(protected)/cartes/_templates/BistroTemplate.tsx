import type { PhysicalMenuData } from "./types";

// Warm French bistro: cream paper, a red header ribbon, a thin double-rule
// framed content area, single column with dotted leaders.
//
// PRINT-SAFE (BUG-8): root is width:100% / max-width:210mm / no min-height, so
// it fills the printable box and sizes to content. Category sections flow
// across pages; individual dishes never split (break-inside on .dish-row) and
// headings stay with their content (break-after handled globally in page.tsx).
export function BistroTemplate({ data }: { data: PhysicalMenuData }) {
  const priceFmt = (p: number) =>
    Number.isInteger(p) ? p.toString() : p.toFixed(2);

  return (
    <div
      className="menu-sheet"
      style={{
        background: "#faf6ee",
        color: "#3b2f2f",
        fontFamily: 'Georgia, "Palatino Linotype", serif',
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: 0,
      }}
    >
      {/* Red ribbon header */}
      {/* Header — ink on cream so it prints reliably; the rustic bistro
          identity comes from the deep-red small-caps title, a gold double rule,
          and the gold-framed content below (no full color band that vanishes
          when print backgrounds are off). */}
      <header
        style={{
          textAlign: "center",
          padding: "10mm 40px 0",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            letterSpacing: 2,
            fontVariant: "small-caps",
            color: "#8c2f2f",
          }}
        >
          {data.restaurantName}
        </h1>
        <p style={{ margin: "6px 0 0", fontStyle: "italic", color: "#8a6d3b", fontSize: 14 }}>
          {data.menuName}
        </p>
        <div style={{ margin: "14px auto 0", maxWidth: 220, borderBottom: "5px double #b98a3e" }} />
      </header>

      {/* Framed content */}
      <div style={{ padding: "10mm 12mm" }}>
        <div
          style={{
            border: "1px solid #d8b26e",
            outline: "3px solid #faf6ee",
            outlineOffset: -6,
            boxShadow: "inset 0 0 0 1px #d8b26e",
            padding: "26px 30px",
            position: "relative",
          }}
        >
          {data.categories.map((cat) => (
            <section key={cat.id} style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontSize: 19,
                  fontVariant: "small-caps",
                  letterSpacing: 1,
                  color: "#8c2f2f",
                  margin: "0 0 4px",
                  textAlign: "center",
                  breakAfter: "avoid",
                }}
              >
                {cat.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  margin: "0 auto 16px",
                  maxWidth: 120,
                }}
              >
                <span style={{ flex: 1, height: 1, background: "#d8b26e" }} />
                <span style={{ color: "#d8b26e", fontSize: 11 }}>&#10070;</span>
                <span style={{ flex: 1, height: 1, background: "#d8b26e" }} />
              </div>

              {cat.dishes.map((dish) => (
                <div key={dish.id} className="dish-row" style={{ marginBottom: 13, breakInside: "avoid" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{dish.name}</span>
                    <span
                      style={{
                        flex: 1,
                        borderBottom: "1px dotted #b8a684",
                        transform: "translateY(-4px)",
                      }}
                    />
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#8c2f2f" }}>
                      {priceFmt(dish.price)} {data.currencySymbol}
                    </span>
                  </div>
                  {dish.description ? (
                    <p style={{ margin: "2px 0 0", fontSize: 12, fontStyle: "italic", color: "#6b5a4e" }}>
                      {dish.description}
                    </p>
                  ) : null}
                  {dish.allergenes && dish.allergenes.length > 0 ? (
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#a1887f" }}>
                      {dish.allergenes.join(" · ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </section>
          ))}
        </div>

        {(data.address || data.phone || data.website) && (
          <footer style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#8c6f5a" }}>
            {[data.address, data.phone, data.website].filter(Boolean).join("   ·   ")}
          </footer>
        )}
      </div>
    </div>
  );
}
