'use server';

import * as z from 'zod';
import { UserRole } from '@prisma/client';

import { db } from '@/lib/db';
import { currentRole } from '@/lib/authentication';
import { AdminSetPlanSchema } from '@/schemas';

/**
 * ADMIN-only server action to set a user's plan, payment method and expiry.
 *
 * Since Stripe is out of scope, paid plans are assigned administratively
 * (cash / offline). Authorization is the ADMIN role check itself: an admin
 * may set the plan of any user. This action must never be exposed to
 * non-admins.
 *
 * `planRenewsAt` is the expiration date (see `getEffectivePlan` in
 * `lib/plan.ts`): a paid plan lapses back to STARTER for gating once this
 * date is in the past. `null`/omitted means no expiry.
 */
export async function adminSetPlan(
  values: z.infer<typeof AdminSetPlanSchema>
) {
  const role = await currentRole();

  if (role !== UserRole.ADMIN) {
    return { error: 'Server action forbidden.' };
  }

  const validatedFields = AdminSetPlanSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid input.' };
  }

  const { userId, plan, planPaymentMethod, planRenewsAt } =
    validatedFields.data;

  const renewsAt = planRenewsAt ? new Date(planRenewsAt) : null;

  if (renewsAt && Number.isNaN(renewsAt.getTime())) {
    return { error: 'Invalid input.' };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        plan,
        planPaymentMethod,
        planRenewsAt: renewsAt
      }
    });
  } catch {
    return { error: "Impossible de mettre à jour le plan de l'utilisateur." };
  }

  return { success: 'Plan mis à jour.' };
}
