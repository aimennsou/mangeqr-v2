# Doodle placeholders

Line-art placeholders for menus that have no uploaded photos — currently the
lead-gen funnel previews at `/m/<leadId>` (see `lib/lead-placeholders.ts`).

Deliberately **doodles, not photographs**. A stock photo of a steak next to a
dish named "Pizza" misrepresents what the restaurant actually serves; a drawing
reads as "no photo yet" and still fills the layout.

Rules if you add one:

- **Transparent background.** The tile sits on the diner theme's surface colour,
  so the doodle adapts to light and dark menus for free. Do not paint a paper
  rectangle behind it.
- **One ink colour, `#B9AE9B`**, with `#D9CFBE` for faint accents. Both read on a
  white surface and on a near-black one. `currentColor` does not work here — the
  file is loaded through `<img src>`, so it has no CSS context to inherit.
- **`240x240` viewBox** for dish tiles, motif kept inside the middle ~70% so
  `object-cover` cropping (72x72 row, 3:4 dialog) never clips it.
- **`800x400`** for covers, motif in the upper half: the cover has a
  `from-black/70` gradient and the restaurant name overlaid along the bottom.
- Stroke-only, `stroke-width` 5 (dish) / 8 (cover), round caps and joins. Thinner
  strokes disappear at 72px.
- No `<script>`, no external references, no embedded raster data. These are
  served as-is by `next/image` (SVGs skip the optimizer), so keep them inert.
