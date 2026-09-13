'use client';

import type { OrderView } from '@/data/orders';
import {
  DEFAULT_PRINTER_CONFIG,
  resolvePrinterConfig,
  type PrinterConfig
} from '@/schemas';

/**
 * Print a receipt / "addition" for an order (FEAT-1). Opens a dedicated print
 * window with a narrow, thermal-printer-friendly layout, lists every line
 * (name, qty, add-ons, special request, line total), the grand total, the
 * table/delivery context, and the PAID / NOT PAID status, then triggers print.
 *
 * The layout + behavior are driven by the per-restaurant `PrinterConfig`
 * (paper width 58/80mm, number of copies, custom header/footer, whether to
 * show the logo/name block and line prices). See schemas/index.ts. When no
 * config is passed the defaults (80mm, 1 copy, logo + prices on) are used.
 *
 * Self-contained (no print library): builds an HTML string and writes it to a
 * popup. Falls back to a hidden iframe if popups are blocked.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function money(n: number, currency: string): string {
  const v = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `${v} ${currency}`;
}

/** Build the inner ticket body (used once per copy). */
function buildTicketBody(
  order: OrderView,
  cfg: typeof DEFAULT_PRINTER_CONFIG
): string {
  const created = new Date(order.createdAt);
  const dateStr = created.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const context =
    order.type === 'DINE_IN'
      ? `Sur place — Table ${esc(order.tableLabel ?? '—')}`
      : 'Livraison';

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
  <div class="row total"><span>TOTAL</span><span>${money(
    order.total,
    order.currency
  )}</span></div>`
    : '';

  const paidBadge = order.paid
    ? `<div class="paid paid-yes">PAYÉ${
        order.paidAt
          ? ' · ' +
            new Date(order.paidAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : ''
      }</div>`
    : `<div class="paid paid-no">NON PAYÉ</div>`;

  const headerBlock = cfg.showLogo
    ? `
  <div class="center">
    <div class="rname">${esc(order.restaurantName ?? 'Restaurant')}</div>
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

  const footerText = cfg.footerText
    ? esc(cfg.footerText)
    : 'Merci de votre visite !<br/>Propulsé par MangeQR';

  return `
  <div class="ticket">
  ${headerBlock}
  <div class="row"><span>Commande</span><strong>#${order.orderNumber}</strong></div>
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
  config?: PrinterConfig | null
): string {
  const cfg = resolvePrinterConfig(config);

  // Physical roll widths: 58mm rolls print ~48mm, 80mm rolls ~72mm.
  const pageWidth = cfg.paperWidth === 58 ? '58mm' : '80mm';
  const bodyWidth = cfg.paperWidth === 58 ? '50mm' : '72mm';
  const baseFont = cfg.paperWidth === 58 ? '11px' : '12px';

  // One body per requested copy, separated by a page break so each prints on
  // its own ticket.
  const copies = Math.min(Math.max(cfg.copies ?? 1, 1), 5);
  const body = buildTicketBody(order, cfg);
  const copiesHtml = Array.from({ length: copies }, (_, i) =>
    i === 0 ? body : `<div class="page-break"></div>${body}`
  ).join('');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Addition #${order.orderNumber}</title>
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
  td.amt { text-align: right; white-space: nowrap; }
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
  <script>
    window.onload = function () {
      window.focus();
      window.print();
      setTimeout(function () { window.close(); }, 300);
    };
  </script>
</body>
</html>`;
}

export function printOrderTicket(
  order: OrderView,
  config?: PrinterConfig | null
): void {
  const html = buildTicketHtml(order, config);

  // Preferred: a popup window that self-prints then closes.
  const win = window.open('', '_blank', 'width=380,height=640');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }

  // Fallback (popups blocked): a temporary hidden iframe.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
  }
  // Clean up the iframe after printing.
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
}
