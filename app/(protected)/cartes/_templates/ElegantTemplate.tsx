import type { PhysicalMenuData } from "./types";

// Classic fine-dining look: serif type, centered header, single column with
// dotted leaders between dish name and price.
//
// PRINT-SAFE (BUG-8): the root uses width:100% with an on-screen max-width of
// 210mm and NO forced min-height, so it fills the @page content box (186mm)
// when printing and sizes to its content (no blank bands). Pagination is
// handled globally in page.tsx: dishes never split, headings never sit alone.
export function ElegantTemplate({ data }: { data: PhysicalMenuData }) {
  const priceFmt = (p: number) =>
    Number.isInteger(p) ? p.toString() : p.toFixed(2);

  return (
    <div
      className="menu-sheet"
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: "#1a1a1a",
        background: "#fff",
        padding: "16mm 18mm",
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "#c9a227", marginBottom: 10 }}>
          {data.menuName}
        </div>
        <h1
          style={{
            fontSize: 34,
            letterSpacing: 4,
            textTransform: "uppercase",
            margin: 0,
            fontWeight: 400,
          }}
        >
          {data.restaurantName}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            margin: "16px auto 0",
            maxWidth: 260,
          }}
        >
          <span style={{ flex: 1, height: 1, background: "#c9a227" }} />
          <span style={{ color: "#c9a227", fontSize: 12 }}>&#10022;</span>
          <span style={{ flex: 1, height: 1, background: "#c9a227" }} />
        </div>
        {(data.address || data.phone) && (
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "#777" }}>
            {[data.address, data.phone].filter(Boolean).join("  ·  ")}
          </p>
        )}
      </header>

      {/* Categories */}
      {data.categories.map((cat) => (
        <section key={cat.id} style={{ marginBottom: 30 }}>
          <h2
            style={{
              fontSize: 18,
              letterSpacing: 2,
              textTransform: "uppercase",
              textAlign: "center",
              margin: "0 0 4px",
              fontWeight: 600,
              breakAfter: "avoid",
            }}
          >
            {cat.logo ? `${cat.logo} ` : ""}
            {cat.name}
          </h2>
          <div
            style={{
              width: 40,
              height: 1,
              background: "#c9a227",
              margin: "0 auto 18px",
            }}
          />

          {cat.dishes.map((dish) => (
            <div key={dish.id} className="dish-row" style={{ marginBottom: 14, breakInside: "avoid" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>{dish.name}</span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: "1px dotted #bbb",
                    transform: "translateY(-4px)",
                  }}
                />
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  {priceFmt(dish.price)} {data.currencySymbol}
                </span>
              </div>
              {dish.description ? (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 12,
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  {dish.description}
                </p>
              ) : null}
              {dish.allergenes && dish.allergenes.length > 0 ? (
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#999" }}>
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
