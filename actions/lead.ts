'use server';

import { type z } from 'zod';

import { db } from '@/lib/db';
import { CreateLeadMenuSchema, LeadOrderSchema } from '@/schemas';
import { getDesignProduct } from '@/config';

/**
 * PUBLIC lead-gen funnel actions — NO authentication. Anonymous visitors from
 * paid ads use these to build a menu and (optionally) order a QR design. Each
 * LeadMenu row is a lead the SUPERADMIN follows up on and converts.
 */

/**
 * Step 1: create an anonymous menu from the funnel. Returns the new lead id so
 * the client can show the public preview (/m/<id>) + QR.
 */
export async function createLeadMenu(
  values: z.infer<typeof CreateLeadMenuSchema>
): Promise<{ error?: string; id?: string }> {
  const parsed = CreateLeadMenuSchema.safeParse(values);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Données invalides.';
    return { error: first };
  }

  const { restaurantName, currency, locale, categories } = parsed.data;

  // Require at least one dish somewhere so the preview isn't empty.
  const hasDish = categories.some((c) => c.dishes.length > 0);
  if (!hasDish) {
    return { error: 'Ajoutez au moins un plat.' };
  }

  try {
    const lead = await db.leadMenu.create({
      data: {
        restaurantName,
        currency,
        locale,
        data: { categories } as unknown as object
      },
      select: { id: true }
    });
    return { id: lead.id };
  } catch {
    return { error: 'Une erreur est survenue. Réessayez.' };
  }
}

/**
 * Step 3: attach a QR-design order + contact info to an existing lead, marking
 * it ORDERED (a hot lead for follow-up). Idempotent-ish: overwrites the order
 * fields if resubmitted.
 */
export async function submitLeadOrder(
  values: z.infer<typeof LeadOrderSchema>
): Promise<{ error?: string; success?: boolean }> {
  const parsed = LeadOrderSchema.safeParse(values);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Données invalides.';
    return { error: first };
  }

  const {
    id,
    designId,
    quantity,
    contactName,
    contactPhone,
    contactEmail,
    deliveryMethod,
    notes
  } = parsed.data;

  const product = getDesignProduct(designId);
  if (!product) {
    return { error: 'Design introuvable.' };
  }

  try {
    // Guard: the lead must exist. updateMany avoids throwing on a bad id.
    const res = await db.leadMenu.updateMany({
      where: { id },
      data: {
        designId,
        designName: product.name,
        quantity,
        contactName,
        contactPhone,
        contactEmail: contactEmail || null,
        deliveryMethod: deliveryMethod || null,
        notes: notes || null,
        status: 'ORDERED'
      }
    });
    if (res.count === 0) {
      return { error: 'Menu introuvable.' };
    }
    return { success: true };
  } catch {
    return { error: 'Une erreur est survenue. Réessayez.' };
  }
}
