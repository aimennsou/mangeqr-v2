import * as z from 'zod';
import { Plan, PlanPaymentMethod } from '@prisma/client';

export const SignInSchema = z.object({
  email: z.string().email({
    message: 'A valid email is required.'
  }),
  password: z.string().min(1, {
    message: 'Password is required.'
  }),
  code: z.optional(z.string())
});

export const SignUpSchema = z
  .object({
    email: z.string().email({
      message: 'A valid email is required.'
    }),
    password: z.string().min(8, {
      message: 'At least 8 characters are required.'
    }),
    confirm: z.string().min(8, {
      message: 'At least 8 characters are required.'
    }),
    name: z.string().min(1, {
      message: 'Name is required.'
    })
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm']
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email({
    message: 'A valid email is required.'
  })
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, {
      message: 'At least 8 characters are required.'
    }),
    confirm: z.string().min(8, {
      message: 'At least 8 characters are required.'
    })
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match.',
    path: ['confirm']
  });

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.'
  }),
  email: z.string().email({
    message: 'A valid email is required.'
  }),
  isTwoFactorEnabled: z.boolean()
});

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: 'At least 8 characters are required.'
    }),
    newPassword: z.string().min(8, {
      message: 'At least 8 characters are required.'
    }),
    confirmPassword: z.string().min(8, {
      message: 'At least 8 characters are required.'
    })
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirm']
  });

// Hex color: #RGB or #RRGGBB
const HexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'A valid hex color is required (e.g. #FFFFFF).'
  });

/**
 * Per-restaurant diner-menu appearance settings (Requirement 4).
 * All fields are optional so partial updates are supported; when nothing is
 * set the diner menu falls back to the default appearance.
 */
export const MenuAppearanceSchema = z.object({
  fontFamily: z.string().trim().min(1).max(100).optional(),
  primaryColor: HexColor.optional(),
  backgroundColor: HexColor.optional(),
  showAddress: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showWifi: z.boolean().optional(),
  showWebsite: z.boolean().optional(),
  showInstagram: z.boolean().optional(),
  showTiktok: z.boolean().optional(),
  showGoogle: z.boolean().optional()
});

export type MenuAppearance = z.infer<typeof MenuAppearanceSchema>;

/**
 * Admin-only payload to set a user's plan, payment method, and expiry
 * (Requirement 3 — cash/offline plans, no Stripe checkout).
 *
 * `planRenewsAt` is the expiration date: `null`/omitted means no expiry.
 * It is accepted as an ISO datetime string (coerced to a `Date` before
 * persisting) so it can be sent from a form or another server context.
 * Expiry is enforced downstream by `getEffectivePlan` (lib/plan.ts): once
 * `planRenewsAt` is in the past a paid plan is treated as STARTER for gating.
 */
export const AdminSetPlanSchema = z.object({
  userId: z.string().uuid({
    message: 'A valid user id is required.'
  }),
  plan: z.enum([Plan.STARTER, Plan.PRO, Plan.PREMIUM]),
  planPaymentMethod: z.enum([PlanPaymentMethod.CASH, PlanPaymentMethod.ONLINE]),
  planRenewsAt: z.string().datetime().nullable().optional()
});

export type AdminSetPlanValues = z.infer<typeof AdminSetPlanSchema>;

/**
 * SUPERADMIN cash-subscription console payloads (superadmin, S5). Gated to the
 * SUPERADMIN role in the action layer; never trust the client.
 */

/** Set a user's plan / payment method / expiry (same shape as AdminSetPlan). */
export const SuperadminSetPlanSchema = z.object({
  userId: z.string().uuid({
    message: 'A valid user id is required.'
  }),
  plan: z.enum([Plan.STARTER, Plan.PRO, Plan.PREMIUM]),
  planPaymentMethod: z.enum([PlanPaymentMethod.CASH, PlanPaymentMethod.ONLINE]),
  planRenewsAt: z.string().datetime().nullable().optional()
});

export type SuperadminSetPlanValues = z.infer<typeof SuperadminSetPlanSchema>;

/** Suspend / reactivate a user, with an optional reason. */
export const SuperadminSetSuspendedSchema = z.object({
  userId: z.string().uuid({
    message: 'A valid user id is required.'
  }),
  suspended: z.boolean(),
  reason: z.string().trim().max(500).optional()
});

export type SuperadminSetSuspendedValues = z.infer<
  typeof SuperadminSetSuspendedSchema
>;

/** Delete a user (cascades their restaurants/data). */
export const SuperadminDeleteUserSchema = z.object({
  userId: z.string().uuid({
    message: 'A valid user id is required.'
  })
});

export type SuperadminDeleteUserValues = z.infer<
  typeof SuperadminDeleteUserSchema
>;

/**
 * Order for a physical QR-code design (Menu numérique → "Commander un design").
 * `designId` references a product in config `DESIGN_PRODUCTS`.
 */
export const DesignOrderSchema = z.object({
  restaurantId: z.string().uuid({
    message: 'Sélectionnez un restaurant valide.'
  }),
  designId: z.string().min(1, {
    message: 'Sélectionnez un design.'
  }),
  quantity: z.coerce
    .number()
    .int()
    .min(1, { message: 'La quantité doit être au moins 1.' })
    .max(1000, { message: 'Quantité trop élevée.' }),
  contactName: z.string().trim().min(1, {
    message: 'Le nom de contact est requis.'
  }),
  contactEmail: z.string().email({
    message: 'Un email de contact valide est requis.'
  }),
  contactPhone: z.string().trim().max(40).optional().or(z.literal('')),
  deliveryMethod: z.string().trim().min(1, {
    message: 'Sélectionnez un mode de livraison.'
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal(''))
});

export type DesignOrderValues = z.infer<typeof DesignOrderSchema>;
