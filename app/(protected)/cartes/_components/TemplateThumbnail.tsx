'use client';

import { getTemplateById } from '../_templates/registry';
import type { PhysicalMenuData } from '../_templates/types';

const SHEET_WIDTH = 794; // A4 width in px @96dpi (matches the live preview)

interface TemplateThumbnailProps {
  templateId: string;
  data: PhysicalMenuData;
  /** Rendered thumbnail width in px. Height follows the A4 ratio unless
   * `heightRatio` clips it to show only the top of the page. */
  width?: number;
  /** Fraction of the full A4 height to show (1 = whole page). Clipping to a
   * smaller value shows just the header/top like a page thumbnail. */
  heightRatio?: number;
  className?: string;
}

/**
 * A scaled-down, non-interactive preview of a physical-menu template rendered
 * with the restaurant's real menu data. The template is rendered at true A4
 * width (794px) inside a fixed box and scaled down with CSS transform so the
 * card shows an accurate miniature of what will be printed.
 */
const SHEET_HEIGHT = SHEET_WIDTH * (297 / 210); // full A4 height @96dpi

export default function TemplateThumbnail({
  templateId,
  data,
  width = 220,
  heightRatio = 1,
  className
}: TemplateThumbnailProps) {
  const Template = getTemplateById(templateId).Component;
  const scale = width / SHEET_WIDTH;
  // Full A4 page height at this scale, then optionally clipped.
  const fullHeight = width * (297 / 210);
  const boxHeight = fullHeight * heightRatio;

  return (
    <div
      className={className}
      style={{
        width,
        height: boxHeight,
        overflow: 'hidden',
        position: 'relative',
        background: '#fff'
      }}
      aria-hidden
    >
      {/* Force the template sheet to fill the full A4 page height so the paper
          background covers the whole page (matching the live preview) instead
          of sizing to a short menu's content. */}
      <style>{`.tpl-thumb-sheet .menu-sheet{min-height:${SHEET_HEIGHT}px;}`}</style>
      <div
        className="tpl-thumb-sheet"
        style={{
          width: SHEET_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none'
        }}
      >
        <Template data={data} />
      </div>
    </div>
  );
}
