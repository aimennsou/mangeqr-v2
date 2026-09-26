import type { TranslationKey } from '@/lib/i18n/dictionaries';

/**
 * Localizable outcome codes for the team join / invite-sign-up flow.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Server Actions in `actions/team` used to return finished French sentences
 * (`{ error: 'Vous êtes déjà membre…' }`). The forms that render them are
 * client components with full access to `useI18n`, but a string that arrives
 * pre-rendered can no longer be translated: an Arabic or English user saw the
 * whole page in their language and a French toast on failure.
 *
 * So the actions now return a CODE and the client resolves it. The action keeps
 * returning a French `error` string too, as a fallback for any caller that is
 * not localized (and so the API shape stays backward compatible) — but every
 * caller that can translate should prefer the code.
 *
 * This module deliberately lives in `lib/`, not in `actions/team`, because that
 * file is `'use server'`: a client component may import TYPES from it but not
 * values, so the code→key maps could not live there.
 */

/** Why a join/redeem attempt failed. */
export type JoinErrorCode =
  /** Code unknown, expired, or already redeemed. */
  | 'invalid'
  /** The redeemer is the owner of the inviting workspace. */
  | 'self'
  /** The redeemer already belongs to some workspace (Membership is unique). */
  | 'already_member'
  /** The redeemer runs their own team and cannot be demoted to member. */
  | 'owns_team'
  /** The redeemer owns restaurants; joining would orphan that data. */
  | 'owns_restaurants'
  /** The inviting workspace has no free seat left on its plan. */
  | 'seat_full'
  /** No authenticated redeemer. */
  | 'unauthorized'
  /** Empty code submitted. */
  | 'code_required'
  /** Sign-up: an account already exists for this e-mail. */
  | 'email_exists'
  /** Sign-up: the account row could not be created. */
  | 'account_create_failed'
  /** Schema validation rejected the payload. */
  | 'invalid_data';

/** Why a join/redeem attempt succeeded (the two flows differ). */
export type JoinSuccessCode =
  /** An existing account redeemed a code. */
  | 'joined'
  /** A new account was created from an invite link and attached. */
  | 'account_created';

export const JOIN_ERROR_KEY: Record<JoinErrorCode, TranslationKey> = {
  invalid: 'join.error.invalid',
  self: 'join.error.self',
  already_member: 'join.error.alreadyMember',
  owns_team: 'join.error.ownsTeam',
  owns_restaurants: 'join.error.ownsRestaurants',
  seat_full: 'join.error.seatFull',
  unauthorized: 'join.error.unauthorized',
  // Reuses the client-side "please enter a code" string rather than adding a
  // second wording for the same condition.
  code_required: 'join.codeRequired',
  email_exists: 'join.error.emailExists',
  account_create_failed: 'join.error.accountFailed',
  invalid_data: 'join.error.invalidData',
};

export const JOIN_SUCCESS_KEY: Record<JoinSuccessCode, TranslationKey> = {
  joined: 'join.success.joined',
  account_created: 'join.success.accountCreated',
};

/**
 * Resolve an outcome code to a dictionary key, tolerating an unknown code.
 *
 * The code crosses a server→client boundary as plain JSON, so it is not
 * type-checked at runtime. An unrecognized value falls back to the generic
 * invalid-code message instead of rendering `undefined`.
 */
export function joinErrorKey(code: string | undefined): TranslationKey {
  if (code && code in JOIN_ERROR_KEY) {
    return JOIN_ERROR_KEY[code as JoinErrorCode];
  }
  return JOIN_ERROR_KEY.invalid;
}

export function joinSuccessKey(code: string | undefined): TranslationKey {
  if (code && code in JOIN_SUCCESS_KEY) {
    return JOIN_SUCCESS_KEY[code as JoinSuccessCode];
  }
  return JOIN_SUCCESS_KEY.joined;
}
