import type { PhysicalMenuData, PhysicalMenuCategory } from "./types";

// "Tableau Vert" — dark chalkboard brasserie menu (reference: dark slate board
// with green FOLDED-RIBBON category banners). Ornate centered header with a
// script "Menu" word flanked by tiny chalk dashes, a big bold UPPERCASE
// restaurant name in a yellow-green accent, the menuName as a styled tagline,
// and a thin outlined ribbon banner beneath (also driven by menuName — no
// fabricated facts like a founding year).
//
// Categories render TWO PER ROW as green folded ribbons (left folds right,
// right folds left) with a dotted connector between them, then the two
// categories' dish lists in a two-column grid underneath. Odd category count →
// last row is a single left ribbon + single left column.
//
// PRINT-SAFE (matches ArdoiseTemplate after BUG-8): root is
// className="menu-sheet", width:100% / maxWidth:210mm / no minHeight / no fixed
// width; padding in mm. The dark board prints because page.tsx forces
// print-color-adjust: exact on `.menu-print-area *`. Pagination uses a
// two-column CSS grid; each dish wrapper is `.dish-row` with breakInside:avoid,
// ribbon header rows carry breakInside:avoid + breakAfter:avoid so a ribbon
// never sits alone at a page bottom, and dish lists still flow between dishes
// for very long categories.

const ACCENT = "#c5d92d"; // yellow-green accent (name, prices, ribbons)
const ACCENT_DARK = "#8a9a1f"; // darker green used for the ribbon "fold"
const BOARD = "#242a26"; // near-black slate board
const RIBBON_TEXT = "#1f2530"; // dark text sits readably on the light-green

const SCRIPT = '"Brush Script MT", "Segoe Script", cursive';
const SANS =
  'Oswald, "Arial Narrow", "Helvetica Neue", Arial, sans-serif';

const priceFmt = (p: number) =>
  Number.isInteger(p) ? p.toString() : p.toFixed(2);

// A single green folded-ribbon category banner. `fold` picks which end carries
// the darker 3D "fold" triangle so a left banner folds right and a right banner
// folds left. Triangles are CSS border triangles (print-safe, no images/pseudo).
function RibbonBanner({
  label,
  fold,
}: {
  label: string;
  fold: "right" | "left";
}) {
  const foldTriangle = (
    <span
      style={{
        width: 0,
        height: 0,
        borderTop: "9px solid transparent",
        borderBottom: "9px solid transparent",
        ...(fold === "right"
          ? { borderLeft: `12px solid ${ACCENT_DARK}` }
          : { borderRight: `12px solid ${ACCENT_DARK}` }),
      }}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: fold === "right" ? "flex-start" : "flex-end",
      }}
    >
      {fold === "left" ? foldTriangle : null}
      <span
        style={{
          display: "inline-block",
          background: ACCENT,
          color: RIBBON_TEXT,
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          padding: "5px 18px",
          boxShadow: "0 2px 0 rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {fold === "right" ? foldTriangle : null}
    </div>
  );
}

// The dish list for a single category. Each dish is a `.dish-row` with
// breakInside:avoid; the list itself flows so long categories can break.
function DishList({ cat, currencySymbol }: { cat: PhysicalMenuCategory; currencySymbol: string }) {
  return (
    <div>
      {cat.dishes.map((dish) => (
        <div
          key={dish.id}
          className="dish-row"
          style={{ marginBottom: 12, breakInside: "avoid" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: "#f5f5f4",
              }}
            >
              {dish.name}
            </span>
            <span
              style={{
                flex: 1,
                borderBottom: "1px dotted #6b7280",
                margin: "0 4px 4px",
              }}
            />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 700,
                color: ACCENT,
                whiteSpace: "nowrap",
              }}
            >
              {priceFmt(dish.price)} {currencySymbol}
            </span>
          </div>
          {dish.description ? (
            <p
              style={{
                margin: "1px 0 0",
                fontSize: 11.5,
                lineHeight: 1.35,
                color: "#c0c4c0",
              }}
            >
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
    </div>
  );
}

export function TableauVertTemplate({ data }: { data: PhysicalMenuData }) {
  // Pair categories two per row.
  const pairs: PhysicalMenuCategory[][] = [];
  for (let i = 0; i < data.categories.length; i += 2) {
    pairs.push(data.categories.slice(i, i + 2));
  }

  return (
    <div
      className="menu-sheet"
      style={{
        background:
          "radial-gradient(circle at 18% 15%, rgba(255,255,255,0.05), transparent 38%), radial-gradient(circle at 82% 55%, rgba(255,255,255,0.055), transparent 34%), radial-gradient(circle at 50% 90%, rgba(255,255,255,0.04), transparent 40%), " +
          BOARD,
        color: "#f5f5f4",
        fontFamily: SANS,
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "12mm",
      }}
    >
      {/* Ornate centered header */}
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        {/* script "Menu" with tiny chalk dashes flanking it */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "#e7e5e4",
          }}
        >
          <span style={{ width: 26, height: 1, background: "#9ca3af" }} />
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#9ca3af" }} />
          <span style={{ fontFamily: SCRIPT, fontSize: 26, lineHeight: 1 }}>Menu</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#9ca3af" }} />
          <span style={{ width: 26, height: 1, background: "#9ca3af" }} />
        </div>

        {/* Restaurant name: big, bold, UPPERCASE, accent green */}
        <h1
          style={{
            margin: "8px 0 0",
            fontFamily: SANS,
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: ACCENT,
            lineHeight: 1.05,
          }}
        >
          {data.restaurantName}
        </h1>

        {/* Tagline: real data (menuName), styled uppercase white */}
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#f5f5f4",
          }}
        >
          {data.menuName}
        </div>

        {/* Thin outlined ribbon banner beneath — decorative divider (no
            fabricated facts). Uses a neutral flourish since menuName is already
            the tagline above. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            margin: "14px auto 0",
          }}
        >
          <span style={{ width: 48, height: 1, background: ACCENT }} />
          <span
            style={{
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: 10,
              letterSpacing: 4,
              textTransform: "uppercase",
              padding: "3px 14px",
            }}
          >
            Bon Appétit
          </span>
          <span style={{ width: 48, height: 1, background: ACCENT }} />
        </div>
      </header>

      {/* Category pairs: two ribbons + dotted connector, then two dish columns */}
      <main>
        {pairs.map((pair, rowIdx) => {
          const [left, right] = pair;
          return (
            <section
              key={left.id}
              style={{ marginBottom: 26, breakInside: "avoid" }}
            >
              {/* Ribbon row: left folds right, right folds left, dotted
                  connector between. breakAfter:avoid keeps ribbons with their
                  dishes. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: right ? "auto 1fr auto" : "auto",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                  breakInside: "avoid",
                  breakAfter: "avoid",
                }}
              >
                <RibbonBanner label={left.name} fold="right" />
                {right ? (
                  <>
                    <span style={{ borderTop: "2px dotted #6b7280", height: 0 }} />
                    <RibbonBanner label={right.name} fold="left" />
                  </>
                ) : null}
              </div>

              {/* Dish columns under each ribbon */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: right ? "1fr 1fr" : "1fr",
                  columnGap: 36,
                  alignItems: "start",
                }}
              >
                <DishList cat={left} currencySymbol={data.currencySymbol} />
                {right ? (
                  <DishList cat={right} currencySymbol={data.currencySymbol} />
                ) : null}
              </div>
            </section>
          );
        })}
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
