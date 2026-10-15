import type { PhysicalMenuData, PhysicalMenuCategory } from "./types";

// "Fast Food" — dark chalkboard street-food poster (reference: a black board
// with a bold "FAST FOOD" title, big FRESH food photos bleeding onto the board
// alongside each category, script-yellow category titles, and dish rows with
// chalk-dash leader lines + yellow prices). No small circular badges — the food
// is shown large, like a promo poster.
//
// Food art uses real licensed photographs stored as project assets under
// /public/menu-templates/fast-food (see CREDITS.md). Each hero photo is given a
// SOFT FEATHERED EDGE via a radial-gradient CSS mask so a rectangular JPG melts
// into the dark board (an approximate "cutout" look) instead of showing a hard
// photo rectangle.
//
// PRINT-SAFE: the dark board + yellow accents print because page.tsx forces
// `print-color-adjust: exact` on `.menu-print-area *`. Photos are plain <img>
// with fixed box sizes so they lay out identically on screen, in the thumbnail,
// and in print. (CSS masks are decorative; if a print engine drops the mask the
// photo still shows, just with a soft dark vignette drawn on top as a fallback.)
// Root follows the shared contract: className="menu-sheet", width:100% /
// maxWidth:210mm / no fixed width or minHeight, padding in mm. Each dish is a
// `.dish-row` with breakInside:avoid; category blocks avoid breaking after the
// title.

const BOARD = "#161412"; // near-black chalkboard
const BOARD_2 = "#201d1a"; // subtle panel tint
const YELLOW = "#f4b526"; // category titles / prices
const CREAM = "#f6f1e7"; // dish name ink
const MUTED = "#a9a295"; // description text
const DASH = "#6f685c"; // chalk leader line

const SANS =
  'Oswald, "Arial Narrow", Impact, "Helvetica Neue", Arial, sans-serif';
const SCRIPT = '"Brush Script MT", "Segoe Script", cursive';

const ASSET_BASE = "/menu-templates/fast-food";

const priceFmt = (p: number) =>
  Number.isInteger(p) ? p.toString() : p.toFixed(2);

/* ---------------------------------------------------------------------------
 * Real food photography (project assets), shown large with feathered edges.
 * ------------------------------------------------------------------------- */

type FoodKey = "burger" | "wrap" | "pizza" | "fries";

const FOOD_SRC: Record<FoodKey, string> = {
  burger: `${ASSET_BASE}/burger.jpg`,
  wrap: `${ASSET_BASE}/wrap.jpg`,
  pizza: `${ASSET_BASE}/pizza.jpg`,
  fries: `${ASSET_BASE}/fries.jpg`,
};

// Rotate a hero photo per category so each block gets a different, fresh piece
// of food art (purely cosmetic; cycles if there are many categories).
const CATEGORY_FOOD: FoodKey[] = ["burger", "wrap", "pizza", "fries"];

// A large food photo with soft, feathered edges so it blends into the dark
// board like a cutout. `object-fit: cover` fills the box; the radial-gradient
// mask fades the rectangle's edges to transparent.
function HeroPhoto({
  food,
  width,
  height,
}: {
  food: FoodKey;
  width: number;
  height: number;
}) {
  // Soft oval mask: solid only in the center, fully transparent before the box
  // edge so the rectangle corners never show.
  const feather =
    "radial-gradient(ellipse 58% 58% at 50% 50%, #000 40%, rgba(0,0,0,0.6) 66%, rgba(0,0,0,0) 86%)";

  // Edge-fade overlays in the board color. Four linear gradients (one per side)
  // reliably melt the STRAIGHT rectangle edges into the board even if a print
  // engine only partially honors the radial image mask above. A radial on top
  // blends the corners. Fades are ~26% deep from each edge.
  const edge = (dir: string) =>
    `linear-gradient(${dir}, ${BOARD} 0%, rgba(22,20,18,0.85) 10%, rgba(22,20,18,0) 30%)`;
  const overlay = [
    `radial-gradient(ellipse 62% 62% at 50% 50%, rgba(22,20,18,0) 55%, ${BOARD} 92%)`,
    edge("to top"),
    edge("to bottom"),
    edge("to left"),
    edge("to right"),
  ].join(",");

  return (
    <div style={{ width, height, position: "relative", flex: "0 0 auto" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FOOD_SRC[food]}
        alt=""
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          WebkitMaskImage: feather,
          maskImage: feather,
        }}
      />
      {/* Board-colored edge/corner fades drawn on top. This is what actually
          hides the hard photo rectangle in browsers/print engines that ignore
          the CSS mask: the four linear gradients dissolve each straight edge
          into the board, and the radial dissolves the corners. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: overlay,
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Category block (title + dish list with chalk-dash leaders)
 * ------------------------------------------------------------------------- */

function CategoryBlock({
  cat,
  currencySymbol,
  align = "left",
}: {
  cat: PhysicalMenuCategory;
  currencySymbol: string;
  align?: "left" | "right";
}) {
  return (
    <div style={{ breakInside: "avoid" }}>
      {/* Script-yellow category title (like the reference "Burger" / "Pizza") */}
      <h2
        style={{
          margin: "0 0 10px",
          fontFamily: SCRIPT,
          fontSize: 40,
          fontWeight: 400,
          lineHeight: 1,
          color: YELLOW,
          textAlign: align,
          breakAfter: "avoid",
        }}
      >
        {cat.name}
      </h2>

      {cat.dishes.map((dish) => (
        <div key={dish.id} className="dish-row" style={{ marginBottom: 9, breakInside: "avoid" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: 0.5,
                color: CREAM,
                whiteSpace: "nowrap",
              }}
            >
              {dish.name}
            </span>
            {/* chalk dash leader */}
            <span
              style={{
                flex: 1,
                borderBottom: `2px dashed ${DASH}`,
                transform: "translateY(-3px)",
              }}
            />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 17,
                fontWeight: 700,
                color: YELLOW,
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
                fontSize: 11,
                fontStyle: "italic",
                lineHeight: 1.3,
                color: MUTED,
              }}
            >
              {dish.description}
            </p>
          ) : null}
          {dish.allergenes && dish.allergenes.length > 0 ? (
            <p style={{ margin: "2px 0 0", fontSize: 9.5, color: "#827b6f" }}>
              {dish.allergenes.join(" · ")}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Template
 * ------------------------------------------------------------------------- */

export function FastFoodTemplate({ data }: { data: PhysicalMenuData }) {
  return (
    <div
      className="menu-sheet"
      style={{
        background: BOARD,
        backgroundImage:
          `radial-gradient(circle at 18% 12%, ${BOARD_2} 0, ${BOARD} 55%),` +
          `radial-gradient(circle at 88% 85%, ${BOARD_2} 0, ${BOARD} 55%)`,
        color: CREAM,
        fontFamily: SANS,
        width: "100%",
        maxWidth: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: "14mm 13mm",
      }}
    >
      {/* ---- Title ---- */}
      <header style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: CREAM,
              lineHeight: 1,
            }}
          >
            {data.restaurantName}
          </span>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span
            style={{
              display: "inline-block",
              background: YELLOW,
              color: "#1b1a18",
              fontFamily: SANS,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: "uppercase",
              padding: "4px 22px",
              borderRadius: "16px 7px 16px 7px",
              transform: "rotate(-1deg)",
            }}
          >
            {data.menuName}
          </span>
        </div>
      </header>

      {/* ---- Category rows: text + big hero photo, side alternating ---- */}
      <main>
        {data.categories.map((cat, idx) => {
          const food = CATEGORY_FOOD[idx % CATEGORY_FOOD.length];
          const photoLeft = idx % 2 === 0; // alternate photo side like the poster
          const Photo = (
            <HeroPhoto food={food} width={250} height={200} />
          );
          const Text = (
            <div style={{ flex: 1, minWidth: 0 }}>
              <CategoryBlock
                cat={cat}
                currencySymbol={data.currencySymbol}
                align={photoLeft ? "left" : "right"}
              />
            </div>
          );
          return (
            <section
              key={cat.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 22,
                breakInside: "avoid",
              }}
            >
              {photoLeft ? (
                <>
                  {Photo}
                  {Text}
                </>
              ) : (
                <>
                  {Text}
                  {Photo}
                </>
              )}
            </section>
          );
        })}
      </main>

      {(data.address || data.phone) && (
        <footer
          style={{
            marginTop: 12,
            borderTop: `1px dashed ${YELLOW}`,
            paddingTop: 12,
            textAlign: "center",
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          {[data.address, data.phone].filter(Boolean).join("   ·   ")}
        </footer>
      )}
    </div>
  );
}
