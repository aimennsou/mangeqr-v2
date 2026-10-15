import type { PhysicalMenuData } from "./types";

// "Élégant Doré" (inspired by reference #3): cream paper, an ornamental thin
// double/filigree gold border frame, centered refined serif, small-caps
// category headings, dotted leaders.
//
// PRINT-SAFE (BUG-8): the decorative frame is a `border` on the .menu-sheet
// root. When the browser fragments the sheet across pages it redraws that
// border box around each page fragment, so the frame repeats safely on every
// page (no need for a fixed-height element). Root is width:100% /
// max-width:210mm / no min-height so it fills the printable box and sizes to
// content. Category sections flow; dishes never split; headings stay with
// their content (break rules applied here + globally in page.tsx).
export function ElegantDoreTemplate({ data }: { data: PhysicalMenuData }) {
  const priceFmt = (p: number) =>
    Number.isInteger(p) ? p.toString() : p.toFixed(2);

  return (
    <div
      className="menu-sheet"
      style={{
        background: "#fbf7ec",
        color: "#2b2620",
        fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
        // Filigree double border that repeats per printed page.
        border: "3px double #b7962f",
        outline: "1px solid #b7962f",
        outlineOffset: 4,
        padding: "14mm 16mm",
      }}
    >
      {/* Header with corner-style flourishes */}
      <header style={{ textAlign: "center", marginBottom: 34 }}>
        <div style={{ color: "#b7962f", fontSize: 20, letterSpacing: 6, marginBottom: 6 }}>
          &#10086;&nbsp;&#10087;&nbsp;&#10086;
        </div>
        <h1
          style={{
            fontSize: 36,
            letterSpacing: 3,
            margin: 0,
            fontWeight: 500,
            fontVariant: "small-caps",
          }}
        >
          {data.restaurantName}
        </h1>
        <p style={{ margin: "8px 0 0", fontStyle: "italic", color: "#7a6f5a", fontSize: 15 }}>
          {data.menuName}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            margin: "16px auto 0",
            maxWidth: 300,
          }}
        >
          <span style={{ flex: 1, height: 1, background: "#d7c48a" }} />
          <span style={{ color: "#b7962f", fontSize: 14 }}>&#10038;</span>
          <span style={{ flex: 1, height: 1, background: "#d7c48a" }} />
        </div>
        {(data.address || data.phone || data.website) && (
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "#8a7f68" }}>
            {[data.address, data.phone, data.website].filter(Boolean).join("   ·   ")}
          </p>
        )}
      </header>

      {/* Categories */}
      {data.categories.map((cat) => (
        <section key={cat.id} style={{ marginBottom: 30 }}>
          <h2
            style={{
              fontSize: 20,
              letterSpacing: 3,
              textAlign: "center",
              margin: "0 0 4px",
              fontWeight: 600,
              fontVariant: "small-caps",
              color: "#7a4a1e",
              breakAfter: "avoid",
            }}
          >
            {cat.name}
          </h2>
          <div
            style={{
              width: 60,
              height: 1,
              background: "#b7962f",
              margin: "0 auto 18px",
            }}
          />

          {cat.dishes.map((dish) => (
            <div key={dish.id} className="dish-row" style={{ marginBottom: 14, breakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{dish.name}</span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: "1px dotted #c3b88a",
                    transform: "translateY(-5px)",
                  }}
                />
                <span style={{ fontSize: 16, fontWeight: 600, color: "#7a4a1e" }}>
                  {priceFmt(dish.price)} {data.currencySymbol}
                </span>
              </div>
              {dish.description ? (
                <p style={{ margin: "2px 0 0", fontSize: 13, fontStyle: "italic", color: "#6f6350" }}>
                  {dish.description}
                </p>
              ) : null}
              {dish.allergenes && dish.allergenes.length > 0 ? (
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9a8d74" }}>
                  {dish.allergenes.join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
