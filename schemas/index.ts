import * as z from 'zod';
import {
  Plan,
  PlanPaymentMethod,
  DesignOrderStatus,
  UserRole,
  SupportMessageStatus,
  Currency
} from '@prisma/client';

export const SignInSchema = z.object({
  email: z.string().min(1, { message: 'L’e-mail est requis.' }).email({
    message: 'Adresse e-mail invalide.'
  }),
  password: z.string().min(1, {
    message: 'Le mot de passe est requis.'
  }),
  code: z.optional(z.string())
});

export const SignUpSchema = z
  .object({
    email: z.string().min(1, { message: 'L’e-mail est requis.' }).email({
      message: 'Adresse e-mail invalide.'
    }),
    password: z.string().min(8, {
      message: '8 caractères minimum.'
    }),
    confirm: z.string().min(1, {
      message: 'Confirmez votre mot de passe.'
    }),
    name: z.string().min(1, {
      message: 'Le nom est requis.'
    })
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm']
  });

/** Owner creates an invite with the invitee's contact prefilled (#13). */
export const CreateInviteSchema = z.object({
  inviteeName: z.string().trim().max(120).optional().or(z.literal('')),
  inviteeEmail: z
    .string()
    .trim()
    .email({ message: 'Adresse e-mail invalide.' })
    .optional()
    .or(z.literal('')),
  inviteePhone: z.string().trim().max(40).optional().or(z.literal('')),
  label: z.string().trim().max(80).optional().or(z.literal('')),
});
export type CreateInviteValues = z.infer<typeof CreateInviteSchema>;

/**
 * Invitee without an account signs up and joins in one step (#13). Requires the
 * invite code + their new credentials + contact. Email-verified on creation so
 * they can sign in immediately.
 */
export const SignUpAndJoinSchema = z
  .object({
    code: z.string().trim().min(1, { message: 'Code requis.' }),
    name: z.string().trim().min(1, { message: 'Le nom est requis.' }),
    email: z
      .string()
      .trim()
      .min(1, { message: 'L’e-mail est requis.' })
      .email({ message: 'Adresse e-mail invalide.' }),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    password: z.string().min(6, { message: '6 caractères minimum.' }),
    confirm: z.string().min(1, { message: 'Confirmez votre mot de passe.' }),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm'],
  });
export type SignUpAndJoinValues = z.infer<typeof SignUpAndJoinSchema>;

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
 * Per-restaurant ticket-printer configuration (FEAT-1 follow-up).
 *
 * The app prints receipts from the browser (a self-printing popup), so this
 * config drives the RECEIPT LAYOUT and print BEHAVIOR rather than talking to a
 * driver directly:
 *  - `paperWidth`  — thermal roll width in mm (58 or 80) → sets the @page size.
 *  - `copies`      — how many identical tickets to print (kitchen + counter…).
 *  - `autoPrint`   — auto-open the print dialog when a new order arrives.
 *  - `headerText`  — extra line under the restaurant name (e.g. "Merci !").
 *  - `footerText`  — replaces the default footer note.
 *  - `showLogo`    — print the restaurant logo/name block.
 *  - `showPrices`  — hide line prices for a kitchen "prep" ticket.
 *  - `printerName` — informational label of the physical printer (browsers
 *                    cannot select a printer silently; this documents which
 *                    one to pick in the print dialog).
 * All fields optional so partial updates work; unset falls back to defaults.
 */
export const PrinterConfigSchema = z.object({
  paperWidth: z.union([z.literal(58), z.literal(80)]).optional(),
  copies: z.number().int().min(1).max(5).optional(),
  autoPrint: z.boolean().optional(),
  headerText: z.string().trim().max(120).optional(),
  footerText: z.string().trim().max(200).optional(),
  showLogo: z.boolean().optional(),
  showPrices: z.boolean().optional(),
  printerName: z.string().trim().max(120).optional()
});

export type PrinterConfig = z.infer<typeof PrinterConfigSchema>;

/**
 * Default ticket-printer configuration used when a restaurant has not set one,
 * and as the base that stored partial configs are merged onto.
 */
export const DEFAULT_PRINTER_CONFIG: Required<
  Pick<
    PrinterConfig,
    'paperWidth' | 'copies' | 'autoPrint' | 'showLogo' | 'showPrices'
  >
> &
  PrinterConfig = {
  paperWidth: 80,
  copies: 1,
  autoPrint: false,
  showLogo: true,
  showPrices: true,
  headerText: '',
  footerText: '',
  printerName: ''
};

/** Merge a stored (possibly partial) printer config onto the defaults. */
export function resolvePrinterConfig(
  stored?: PrinterConfig | null
): typeof DEFAULT_PRINTER_CONFIG {
  return { ...DEFAULT_PRINTER_CONFIG, ...(stored ?? {}) };
}

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
 * Enable/disable ORDERING for an account (FEAT-1/D16). SUPERADMIN-only.
 */
export const SuperadminSetOrderingEnabledSchema = z.object({
  userId: z.string().uuid({ message: 'A valid user id is required.' }),
  enabled: z.boolean()
});

export type SuperadminSetOrderingEnabledValues = z.infer<
  typeof SuperadminSetOrderingEnabledSchema
>;

/**
 * SUPERADMIN creates a user account directly (bypassing self-service sign-up
 * and email verification). Optionally ties the new user to an existing OWNER as
 * a team MEMBER, bypassing the invitation flow. Role defaults to USER.
 */
export const SuperadminCreateUserSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nom requis.' }).max(120),
  email: z.string().email({ message: 'Email invalide.' }),
  password: z.string().min(8, { message: 'Mot de passe : 8 caractères min.' }),
  role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPERADMIN]).default(UserRole.USER),
  /** When set, create a Membership tying this user (MEMBER) to this owner. */
  ownerUserId: z.string().uuid().nullable().optional()
});

export type SuperadminCreateUserValues = z.infer<
  typeof SuperadminCreateUserSchema
>;

/** SUPERADMIN cancels a user's ONLINE (Stripe) subscription at period end. */
export const SuperadminCancelSubscriptionSchema = z.object({
  userId: z.string().uuid({ message: 'A valid user id is required.' })
});

export type SuperadminCancelSubscriptionValues = z.infer<
  typeof SuperadminCancelSubscriptionSchema
>;

/** SUPERADMIN updates a support message's triage status. */
export const SuperadminSetSupportStatusSchema = z.object({
  id: z.string().uuid({ message: 'A valid id is required.' }),
  status: z.enum([
    SupportMessageStatus.NEW,
    SupportMessageStatus.READ,
    SupportMessageStatus.RESOLVED
  ])
});

export type SuperadminSetSupportStatusValues = z.infer<
  typeof SuperadminSetSupportStatusSchema
>;

/**
 * SUPERADMIN creates/updates a restaurant on behalf of any user. On create,
 * `id` is omitted and `ownerUserId` is required; on update, `id` is required
 * and `ownerUserId` is ignored (ownership is not reassigned). Subdomain is
 * validated/normalized in the action.
 */
export const SuperadminUpsertRestaurantSchema = z.object({
  id: z.string().uuid().optional(),
  ownerUserId: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: 'Nom requis.' }).max(160),
  address: z.string().trim().min(1, { message: 'Adresse requise.' }).max(300),
  phone: z.string().trim().min(1, { message: 'Téléphone requis.' }).max(60),
  currency: z.nativeEnum(Currency).default(Currency.EURO),
  subdomain: z.string().trim().optional(),
  coverPhoto: z.string().trim().optional(),
  wifi: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  instagram: z.string().trim().optional().nullable(),
  tiktok: z.string().trim().optional().nullable(),
  google: z.string().trim().optional().nullable()
});

export type SuperadminUpsertRestaurantValues = z.infer<
  typeof SuperadminUpsertRestaurantSchema
>;

/** SUPERADMIN deletes a restaurant (any owner) by id. */
export const SuperadminDeleteRestaurantSchema = z.object({
  id: z.string().uuid({ message: 'A valid id is required.' })
});

export type SuperadminDeleteRestaurantValues = z.infer<
  typeof SuperadminDeleteRestaurantSchema
>;

/**
 * In-app support message from an authenticated user. Name/email are prefilled
 * from the session but editable; the message is required. Persisted to the
 * SupportMessage table so it surfaces in the superadmin support inbox.
 */
export const SupportMessageSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nom requis.' }).max(120),
  email: z.string().email({ message: 'Email invalide.' }),
  message: z
    .string()
    .trim()
    .min(5, { message: 'Votre message est trop court.' })
    .max(4000, { message: 'Votre message est trop long.' })
});

export type SupportMessageValues = z.infer<typeof SupportMessageSchema>;

/** A reply posted to an existing support ticket (by the user or by staff). */
export const SupportReplySchema = z.object({
  ticketId: z.string().uuid({ message: 'A valid ticket id is required.' }),
  body: z
    .string()
    .trim()
    .min(1, { message: 'Votre réponse est vide.' })
    .max(4000, { message: 'Votre réponse est trop longue.' })
});

export type SupportReplyValues = z.infer<typeof SupportReplySchema>;

/**
 * Lead-gen funnel (public, no auth). A visitor builds a quick menu, then may
 * order a physical QR design which captures their contact info.
 */
const LeadDishSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).optional().or(z.literal('')),
  price: z.coerce.number().min(0).max(100000)
});

const LeadCategorySchema = z.object({
  name: z.string().trim().min(1, { message: 'Nom de catégorie requis.' }).max(120),
  dishes: z.array(LeadDishSchema).max(50)
});

export const CreateLeadMenuSchema = z.object({
  restaurantName: z
    .string()
    .trim()
    .min(1, { message: 'Le nom du restaurant est requis.' })
    .max(160),
  currency: z.enum(['EURO', 'DOLLAR', 'DINAR']).default('EURO'),
  locale: z.enum(['fr', 'ar']).default('fr'),
  categories: z
    .array(LeadCategorySchema)
    .min(1, { message: 'Ajoutez au moins une catégorie avec un plat.' })
    .max(20)
});

export type CreateLeadMenuValues = z.infer<typeof CreateLeadMenuSchema>;

export const LeadOrderSchema = z.object({
  id: z.string().uuid(),
  designId: z.string().min(1, { message: 'Choisissez un design.' }),
  quantity: z.coerce.number().int().min(1).max(1000).default(1),
  contactName: z.string().trim().min(1, { message: 'Votre nom est requis.' }).max(120),
  contactPhone: z.string().trim().min(1, { message: 'Votre téléphone est requis.' }).max(40),
  contactEmail: z
    .string()
    .trim()
    .email({ message: 'Email invalide.' })
    .optional()
    .or(z.literal('')),
  deliveryMethod: z.string().trim().max(60).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal(''))
});

export type LeadOrderValues = z.infer<typeof LeadOrderSchema>;

/** SUPERADMIN updates a lead's follow-up status. */
export const SuperadminSetLeadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['NEW', 'ORDERED', 'CONTACTED', 'CONVERTED', 'CLOSED'])
});

export type SuperadminSetLeadStatusValues = z.infer<
  typeof SuperadminSetLeadStatusSchema
>;

/** CRM: update a lead's follow-up fields (all optional; only sent ones apply). */
export const SuperadminUpdateLeadSchema = z.object({
  id: z.string().uuid(),
  status: z
    .enum(['NEW', 'ORDERED', 'CONTACTED', 'CONVERTED', 'CLOSED'])
    .optional(),
  callStatus: z
    .enum([
      'NOT_CALLED',
      'CALLED',
      'CALLED_TWICE',
      'NO_ANSWER',
      'CALLBACK',
      'WRONG_NUMBER'
    ])
    .optional(),
  deliveryStatus: z
    .enum(['NONE', 'PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED'])
    .optional(),
  orderStatus: z
    .enum(['NONE', 'PLACED', 'CONFIRMED', 'PAID', 'CANCELLED'])
    .optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  followUpNotes: z.string().trim().max(2000).optional().or(z.literal('')),
  nextFollowUpAt: z.string().optional().or(z.literal('')),
});
export type SuperadminUpdateLeadValues = z.infer<
  typeof SuperadminUpdateLeadSchema
>;

/** Admin broadcast notification to users (#14). */
export const SuperadminBroadcastSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(1000).optional().or(z.literal('')),
  link: z.string().trim().max(200).optional().or(z.literal('')),
  // Audience: all users, or only paid plans.
  audience: z.enum(['ALL', 'PAID']).default('ALL'),
});
export type SuperadminBroadcastValues = z.infer<
  typeof SuperadminBroadcastSchema
>;

/** CRM: log a call attempt on a lead (increments callAttempts, sets callStatus). */
export const SuperadminLogLeadCallSchema = z.object({
  id: z.string().uuid(),
  callStatus: z.enum([
    'CALLED',
    'CALLED_TWICE',
    'NO_ANSWER',
    'CALLBACK',
    'WRONG_NUMBER'
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type SuperadminLogLeadCallValues = z.infer<
  typeof SuperadminLogLeadCallSchema
>;

/** CRM: add a free-form note to a lead's timeline. */
export const SuperadminLeadNoteSchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});
export type SuperadminLeadNoteValues = z.infer<typeof SuperadminLeadNoteSchema>;

/**
 * Convert a funnel lead into a real account: creates the user (with the given
 * credentials) and materializes the stored menu JSON into a restaurant + menu +
 * categories + dishes, linking everything to the new account.
 */
export const SuperadminConvertLeadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  plan: z.enum(['STARTER', 'PRO', 'PREMIUM']).optional(),
});
export type SuperadminConvertLeadValues = z.infer<
  typeof SuperadminConvertLeadSchema
>;

/**
 * Update a design order's fulfillment status (FEAT-6). SUPERADMIN-only; the
 * status must be one of the DesignOrderStatus enum values.
 */
export const SuperadminSetDesignOrderStatusSchema = z.object({
  orderId: z.string().uuid({
    message: 'A valid order id is required.'
  }),
  status: z.enum([
    DesignOrderStatus.PENDING,
    DesignOrderStatus.IN_PROGRESS,
    DesignOrderStatus.SHIPPED,
    DesignOrderStatus.DELIVERED,
    DesignOrderStatus.CANCELLED
  ])
});

export type SuperadminSetDesignOrderStatusValues = z.infer<
  typeof SuperadminSetDesignOrderStatusSchema
>;

/**
 * FEAT-2 — Table layout (floor plan) payloads. The owner saves the whole plan
 * (zones + tables) in one call so drag-to-arrange positions persist atomically.
 * Ids may be client-generated (uuid) for new rows; the server upserts by id
 * scoped to the restaurant.
 */
const ZoneInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, { message: 'Nom de zone requis.' }).max(60),
  position: z.coerce.number().int().min(0).default(0)
});

const TableInputSchema = z.object({
  id: z.string().uuid(),
  label: z
    .string()
    .trim()
    .min(1, { message: 'Numéro/nom de table requis.' })
    .max(20),
  seats: z.coerce.number().int().min(0).max(100).nullable().optional(),
  zoneId: z.string().uuid().nullable().optional(),
  posX: z.coerce.number().default(0),
  posY: z.coerce.number().default(0)
});

export const SaveFloorPlanSchema = z.object({
  restaurantId: z.string().uuid({ message: 'Restaurant invalide.' }),
  zones: z.array(ZoneInputSchema).max(50),
  tables: z.array(TableInputSchema).max(500)
});

export type SaveFloorPlanValues = z.infer<typeof SaveFloorPlanSchema>;

/**
 * FEAT-1/D12 — Save a dish's add-on groups (single/multi-select) with their
 * options and price deltas. The whole set is replaced on save; ids may be
 * client-generated uuids for new rows.
 */
const AddonOptionInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, { message: "Nom d'option requis." }).max(60),
  priceDelta: z.coerce.number().min(-10000).max(100000).default(0),
  position: z.coerce.number().int().min(0).default(0)
});

const AddonGroupInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, { message: 'Nom de groupe requis.' }).max(60),
  type: z.enum(['SINGLE', 'MULTI']),
  required: z.boolean().default(false),
  position: z.coerce.number().int().min(0).default(0),
  options: z.array(AddonOptionInputSchema).min(1).max(30)
});

export const SaveDishAddonsSchema = z.object({
  dishId: z.string().uuid({ message: 'Plat invalide.' }),
  groups: z.array(AddonGroupInputSchema).max(20)
});

export type SaveDishAddonsValues = z.infer<typeof SaveDishAddonsSchema>;

/**
 * FEAT-1 — Diner order submission (public, no auth). The client sends dish ids,
 * quantities, chosen add-on OPTION ids, and special requests; the server
 * recomputes all prices from the DB (never trusts client prices). Dine-in
 * requires a tableId; delivery requires contact + (address or geolocation).
 */
const OrderLineInputSchema = z.object({
  dishId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
  // Chosen add-on option ids (validated server-side against the dish's groups).
  optionIds: z.array(z.string().uuid()).max(50).default([]),
  specialRequest: z.string().trim().max(300).optional().or(z.literal(''))
});

export const CreateOrderSchema = z
  .object({
    restaurantId: z.string().uuid({ message: 'Restaurant invalide.' }),
    type: z.enum(['DINE_IN', 'DELIVERY']),
    tableId: z.string().uuid().nullable().optional(),
    customerName: z.string().trim().max(120).optional().or(z.literal('')),
    customerPhone: z.string().trim().max(40).optional().or(z.literal('')),
    address: z.string().trim().max(400).optional().or(z.literal('')),
    latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
    longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
    note: z.string().trim().max(500).optional().or(z.literal('')),
    items: z.array(OrderLineInputSchema).min(1, {
      message: 'Ajoutez au moins un article.'
    })
  })
  .refine((v) => v.type !== 'DINE_IN' || !!v.tableId, {
    message: 'Sélectionnez votre table.',
    path: ['tableId']
  })
  .refine(
    (v) =>
      v.type !== 'DELIVERY' ||
      (!!v.customerName && !!v.customerPhone),
    { message: 'Nom et téléphone requis pour la livraison.', path: ['customerName'] }
  )
  .refine(
    (v) =>
      v.type !== 'DELIVERY' ||
      !!v.address ||
      (v.latitude != null && v.longitude != null),
    {
      message: 'Adresse ou position requise pour la livraison.',
      path: ['address']
    }
  );

export type CreateOrderValues = z.infer<typeof CreateOrderSchema>;

/**
 * FEAT-1 — Owner/staff order status update. The status must be one of the
 * OrderStatus enum values. Access (owner + members) is enforced in the action.
 */
export const SetOrderStatusSchema = z.object({
  orderId: z.string().uuid({ message: 'Commande invalide.' }),
  status: z.enum([
    'RECEIVED',
    'IN_PREPARATION',
    'READY',
    'SERVED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
  ])
});

export type SetOrderStatusValues = z.infer<typeof SetOrderStatusSchema>;

/**
 * FEAT-1 — Mark an order as paid / not paid (pay-in-person). Owner + members.
 */
export const SetOrderPaidSchema = z.object({
  orderId: z.string().uuid({ message: 'Commande invalide.' }),
  paid: z.boolean()
});

export type SetOrderPaidValues = z.infer<typeof SetOrderPaidSchema>;

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
