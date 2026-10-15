import type { PhysicalMenuData } from "./types";

// "Bistro" — a warm, paper-first bistro card (formerly a dark slate board).
//
// PRINT-ROBUST: dark-background designs print as an invisible/ink-wasting mess
// when the browser's "background graphics" option is OFF (the common default).
// So this is ink-on-cream: dark serif text on a light paper tone, a signature
// amber ribbon for category labels (dark ink on amber — readable even if the
// band color is dropped in print), thin rules, two-column grid. It reads the
// same with background graphics ON or OFF. Root: menu-sheet, width:100% /
// max-width:210mm / no min-height; each dish is a break-inside:avoid .dish-row.
const INK = "#2b2622";
const AMBER = "#e0a92e";
const RULE = "#d8ccb8";
const SCRIPT = '"Brush Script MT", "Segoe Script", cursive';
const SERIF = 'Georgia, "Times New Roman", serif';

export function ArdoiseTemplate({ data }: { data: PhysicalMenuData }) {
  const priceFmt = (p: number) =>
    Number.isInteger(p) ? p.toString() : p.toFixed(2);

  return (
    <div
      className="menu-sheet"
      style={{
        background: "#f7f1e6",
        color: INK,
        fontFamily: SERIF,
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "14mm 14mm",
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontFamily: SCRIPT, fontSize: 46, lineHeight: 1.1, color: INK }}>
          {data.restaurantName}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            margin: "10px auto 0",
            color: "#7a6f5f",
          }}
        >
          <span style={{ flex: "0 0 40px", height: 1, background: AMBER }} />
          <span style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>
            {data.menuName}
          </span>
          <span style={{ flex: "0 0 40px", height: 1, background: AMBER }} />
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
          <section key={cat.id} style={{ breakInside: "avoid", marginBottom: 24 }}>
            {/* Amber ribbon category label — dark ink stays legible even if the
                band color is dropped in print. */}
            <div style={{ textAlign: "center", marginBottom: 14, breakAfter: "avoid" }}>
              <span
                style={{
                  display: "inline-block",
                  background: AMBER,
                  color: INK,
                  fontFamily: SERIF,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "4px 20px",
                  border: `1px solid ${INK}`,
                }}
              >
                {cat.name}
              </span>
            </div>

            {cat.dishes.map((dish) => (
              <div key={dish.id} className="dish-row" style={{ marginBottom: 12, breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>
                    {dish.name}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>
                    {priceFmt(dish.price)} {data.currencySymbol}
                  </span>
                </div>
                {dish.description ? (
                  <p style={{ margin: "2px 0 0", fontSize: 12, fontStyle: "italic", color: "#6f6455" }}>
                    {dish.description}
                  </p>
                ) : null}
                {dish.allergenes && dish.allergenes.length > 0 ? (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9b8f7c" }}>
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
            borderTop: `1px solid ${RULE}`,
            paddingTop: 14,
            textAlign: "center",
            fontSize: 11,
            color: "#7a6f5f",
            letterSpacing: 1,
          }}
        >
          {[data.address, data.phone].filter(Boolean).join("   ·   ")}
        </footer>
      )}
    </div>
  );
}
