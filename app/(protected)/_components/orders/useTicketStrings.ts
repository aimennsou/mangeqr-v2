'use client';

import { useMemo } from 'react';

import { useI18n } from '@/lib/i18n';
import type { TicketOptions } from './print-ticket';

/**
 * Build the localized strings + locale that `printOrderTicket` / `buildTicketHtml`
 * need, so a printed ticket comes out in the staff member's language instead of
 * always in French (dates included — the ticket used to hardcode `fr-FR`).
 *
 * Returned object is memoized on the locale, so it is safe to hold in a ref and
 * read from a polling callback.
 */
export function useTicketOptions(): TicketOptions {
  const { t, locale } = useI18n();

  return useMemo(
    () => ({
      locale,
      strings: {
        title: t('printer.ticket.title'),
        order: t('printer.ticket.order'),
        dineIn: t('printer.ticket.dineIn'),
        delivery: t('printer.ticket.delivery'),
        total: t('printer.ticket.total'),
        paid: t('printer.ticket.paid'),
        notPaid: t('printer.ticket.notPaid'),
        restaurant: t('printer.ticket.restaurant'),
        thanks: t('printer.ticket.thanks'),
        poweredBy: t('printer.ticket.poweredBy')
      }
    }),
    // `t` is derived from `locale` inside the provider, so locale is the only
    // real dependency.
    [t, locale]
  );
}
