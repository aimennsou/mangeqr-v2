'use client';

import type { OrderView } from '@/data/orders';
import {
  DEFAULT_PRINTER_CONFIG,
  resolvePrinterConfig,
  type PrinterConfig
} from '@/schemas';
import { DEFAULT_LOCALE, dirForLocale, type Locale } from '@/lib/i18n/config';

/**
 * Print a receipt / "addition" for an order (FEAT-1). Builds a narrow,
 * thermal-printer-friendly HTML document listing every line (name, qty,
 * add-ons, special request, line total), the grand total, the table/delivery
 * context and the PAID / NOT PAID status, then triggers the browser print
 * dialog.
 *
 * The layout is driven by the per-restaurant `PrinterConfig` (paper width
 * 58/80mm, number of copies, custom header/footer, whether to show the
 * logo/name block and line prices). See schemas/index.ts.
 *
 * Self-contained (no print library). There is NO server-side or ESC/POS path:
 * printing only happens while a staff browser tab is open and the board is
 * mounted, so closing the laptop stops auto-printing. Browsers also show a print
 * DIALOG; true one-tap silent printing needs a kiosk-printing flag
 * (Chrome --kiosk-printing) or a native agent.
 *
 * WHAT *IS* recorded server-side: `Order.ticketPrintedAt`, claimed atomically via
 * `claimTicketPrint` (data/orders.ts) so exactly one board/tab/device ever prints
 * a given order. See print-dedupe.ts. That column is the print log, not a full
 * audit trail — it says an order was claimed for printing, not that paper came
 * out of the printer, which the browser cannot tell us.
 */

/** Strings the ticket needs; supplied by the caller from the dictionary. */
export interface TicketStrings {
  title: string;
  order: string;
  dineIn: string;
  delivery: string;
  total: string;
  paid: string;
  notPaid: string;
  restaurant: string;
  thanks: string;
  poweredBy: string;
}

/**
 * French fallback so `printOrderTicket` keeps working if a caller doesn't pass
 * strings. Prefer passing the translated set.
 */
const FR_TICKET_STRINGS: TicketStrings = {
  title: 'Addition',
  order: 'Commande',
  dineIn: 'Sur place — Table',
  delivery: 'Livraison',
  total: 'TOTAL',
  paid: 'PAYÉ',
  notPaid: 'NON PAYÉ',
  restaurant: 'Restaurant',
  thanks: 'Merci de votre visite !',
  poweredBy: 'Propulsé par MangeQR'
};

export interface TicketOptions {
  strings?: TicketStrings;
  locale?: Locale;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(n: number, currency: string): string {
  const v = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `${v} ${currency}`;
}

/** BCP-47 tag for date formatting. */
function intlLocale(locale: Locale): string {
  return locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR';
}

/** Build the inner ticket body (used once per copy). */
function buildTicketBody(
  order: OrderView,
  cfg: typeof DEFAULT_PRINTER_CONFIG,
  s: TicketStrings,
  locale: Locale
): string {
  const created = new Date(order.createdAt);
  const dateStr = created.toLocaleString(intlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const context =
    order.type === 'DINE_IN'
      ? `${esc(s.dineIn)} ${esc(order.tableLabel ?? '—')}`
      : esc(s.delivery);

  const deliveryBlock =
    order.type === 'DELIVERY'
      ? `
        <div class="block">
          ${order.customerName ? `<div>${esc(order.customerName)}</div>` : ''}
          ${order.customerPhone ? `<div>${esc(order.customerPhone)}</div>` : ''}
          ${order.address ? `<div>${esc(order.address)}</div>` : ''}
        </div>`
      : '';

  const itemsRows = order.items
    .map((it) => {
      const addons =
        it.addons.length > 0
          ? `<div class="sub">+ ${esc(
              it.addons.map((a) => a.optionName).join(', ')
            )}</div>`
          : '';
      const req = it.specialRequest
        ? `<div class="sub">“${esc(it.specialRequest)}”</div>`
        : '';
      const amt = cfg.showPrices
        ? `<td class="amt">${money(it.lineTotal, order.currency)}</td>`
        : '';
      return `
        <tr>
          <td class="qty">${it.quantity}×</td>
          <td class="name">${esc(it.dishName)}${addons}${req}</td>
          ${amt}
        </tr>`;
    })
    .join('');

  const totalBlock = cfg.showPrices
    ? `
  <hr />
  <div class="row total"><span>${esc(s.total)}</span><span>${money(
    order.total,
    order.currency
  )}</span></div>`
    : '';

  const paidBadge = order.paid
    ? `<div class="paid paid-yes">${esc(s.paid)}${
        order.paidAt
          ? ' · ' +
            new Date(order.paidAt).toLocaleString(intlLocale(locale), {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : ''
      }</div>`
    : `<div class="paid paid-no">${esc(s.notPaid)}</div>`;

  const headerBlock = cfg.showLogo
    ? `
  <div class="center">
    <div class="rname">${esc(order.restaurantName ?? s.restaurant)}</div>
    ${
      order.restaurantAddress
        ? `<div class="muted">${esc(order.restaurantAddress)}</div>`
        : ''
    }
    ${
      order.restaurantPhone
        ? `<div class="muted">${esc(order.restaurantPhone)}</div>`
        : ''
    }
    ${cfg.headerText ? `<div class="muted">${esc(cfg.headerText)}</div>` : ''}
  </div>
  <hr />`
    : cfg.headerText
    ? `<div class="center muted">${esc(cfg.headerText)}</div><hr />`
    : '';

  // A custom footer is escaped (it is user input); the default one is ours and
  // intentionally contains a line break.
  const footerText = cfg.footerText
    ? esc(cfg.footerText)
    : `${esc(s.thanks)}<br/>${esc(s.poweredBy)}`;

  return `
  <div class="ticket">
  ${headerBlock}
  <div class="row"><span>${esc(s.order)}</span><strong>#${
    order.orderNumber
  }</strong></div>
  <div class="row"><span>${dateStr}</span></div>
  <div class="row"><span>${context}</span></div>
  ${deliveryBlock}
  <hr />
  <table>${itemsRows}</table>
  ${totalBlock}
  ${paidBadge}
  <div class="foot">${footerText}</div>
  </div>`;
}

export function buildTicketHtml(
  order: OrderView,
  config?: PrinterConfig | null,
  options?: TicketOptions
): string {
  const cfg = resolvePrinterConfig(config);
  const s = options?.strings ?? FR_TICKET_STRINGS;
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const dir = dirForLocale(locale);

  // Physical roll widths: 58mm rolls print ~48mm, 80mm rolls ~72mm.
  const pageWidth = cfg.paperWidth === 58 ? '58mm' : '80mm';
  const bodyWidth = cfg.paperWidth === 58 ? '48mm' : '72mm';
  const baseFont = cfg.paperWidth === 58 ? '11px' : '12px';

  // One body per requested copy, separated by a page break so each prints on
  // its own ticket.
  const copies = Math.min(Math.max(cfg.copies ?? 1, 1), 5);
  const body = buildTicketBody(order, cfg, s, locale);
  const copiesHtml = Array.from({ length: copies }, (_, i) =>
    i === 0 ? body : `<div class="page-break"></div>${body}`
  ).join('');

  // NOTE: no inline <script> here. Printing is driven by the opener (see
  // `printOrderTicket`), because a script injected via document.write races the
  // load event and gave no way to detect failure.
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${esc(s.title)} #${order.orderNumber}</title>
<style>
  @page { size: ${pageWidth} auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Courier New", ui-monospace, monospace;
    color: #000;
    width: ${bodyWidth};
    margin: 0 auto;
    font-size: ${baseFont};
    line-height: 1.35;
  }
  .center { text-align: center; }
  .rname { font-size: 15px; font-weight: 700; }
  .muted { color: #333; font-size: 11px; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 2px 0; }
  td.qty { width: 26px; }
  td.amt { text-align: end; white-space: nowrap; }
  .sub { font-size: 10px; color: #333; }
  .total { font-size: 15px; font-weight: 700; }
  .paid { text-align: center; font-weight: 700; margin-top: 8px; padding: 4px; border: 2px solid #000; }
  .paid-no { border-style: dashed; }
  .block { font-size: 11px; margin: 4px 0; }
  .foot { margin-top: 10px; font-size: 10px; text-align: center; color: #333; }
  .page-break { break-before: page; page-break-before: always; }
</style>
</head>
<body>
  ${copiesHtml}
</body>
</html>`;
}

export type PrintResult = 'printed' | 'blocked' | 'failed';

/**
 * Render and print the ticket.
 *
 * Returns how it went so the caller can tell staff when nothing came out —
 * previously a blocked popup failed silently, which on a busy service looks
 * exactly like a printer problem.
 *
 * Strategy: always use a hidden iframe. It needs no popup permission, and the
 * parent drives `print()` from the iframe's own load event, so there is no race
 * with an injected inline script. The frame is torn down on `afterprint` (with a
 * long timeout as a backstop) rather than after a fixed 2s, which used to be
 * capable of removing the frame while the print dialog was still open and
 * cancelling the job.
 */
export function printOrderTicket(
  order: OrderView,
  config?: PrinterConfig | null,
  options?: TicketOptions
): PrintResult {
  const html = buildTicketHtml(order, config, options);

  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.title = `ticket-${order.orderNumber}`;
    iframe.style.position = 'fixed';
    iframe.style.inset = 'auto 0 0 auto';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      iframe.remove();
    };

    iframe.onload = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        return;
      }
      // Remove the frame once the dialog closes. Chrome and Firefox both fire
      // afterprint; the timeout covers browsers that don't.
      frameWindow.addEventListener('afterprint', cleanup, { once: true });
      try {
        frameWindow.focus();
        frameWindow.print();
      } catch {
        cleanup();
        return;
      }
      // Backstop: 60s is comfortably longer than a human takes to confirm a
      // print dialog, and far safer than cancelling a live job.
      setTimeout(cleanup, 60_000);
    };

    document.body.appendChild(iframe);

    // `srcdoc` avoids document.write and keeps the load event meaningful.
    iframe.srcdoc = html;
    return 'printed';
  } catch {
    return 'failed';
  }
}
