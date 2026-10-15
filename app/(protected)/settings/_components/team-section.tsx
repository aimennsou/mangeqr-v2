'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Check,
  KeyRound,
  Loader2,
  Trash2,
  UserPlus,
  Users,
  ShieldCheck,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  MEMBER_PERMISSIONS,
  DEFAULT_MEMBER_PERMISSIONS,
  type MemberPermission,
} from '@/lib/permissions';
import {
  generateInvite,
  revokeInvite,
  removeTeamMember,
  updateTeamMemberPermissions,
  resetMemberPassword,
} from '@/actions/team';
import CopyIdButton from './copy-id-button';

export interface TeamMemberView {
  membershipId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  permissions: MemberPermission[];
  /** null = all of the owner's restaurants. See lib/restaurant-scope.ts. */
  restaurantIds: string[] | null;
}

export interface TeamInviteView {
  id: string;
  code: string;
  link: string;
}

export interface TeamRestaurantView {
  id: string;
  name: string;
}

interface TeamSectionProps {
  used: number;
  limit: number;
  members: TeamMemberView[];
  invites: TeamInviteView[];
  /** The owner's restaurants, offered as the per-member scope choices. */
  restaurants: TeamRestaurantView[];
}

/**
 * Per-restaurant scope picker.
 *
 * "Tous les restaurants" is a real, selectable state rather than the absence of
 * a selection: `selected = null` means unscoped, and clearing every checkbox
 * returns to it. That mirrors the storage semantics (an empty array normalizes to
 * null) so the UI cannot express a state the backend would reinterpret.
 *
 * Rendered only when the owner has 2+ restaurants — with a single restaurant the
 * control has nothing to choose and would just be noise.
 */
function RestaurantScopePicker({
  restaurants,
  selected,
  onChange,
  disabled,
}: {
  restaurants: TeamRestaurantView[];
  selected: string[] | null;
  onChange: (next: string[] | null) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  if (restaurants.length < 2) return null;

  const isAll = selected === null;

  const toggle = (id: string) => {
    const current = selected ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    // Empty selection collapses back to "all", matching parseRestaurantScope.
    onChange(next.length === 0 ? null : next);
  };

  return (
    <div className='space-y-2 border-t pt-3'>
      <p className='text-xs font-medium text-foreground'>
        {t('team.scopeTitle')}
      </p>
      <div className='grid gap-2 sm:grid-cols-2'>
        <button
          type='button'
          onClick={() => onChange(null)}
          aria-pressed={isAll}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 rounded-md border p-2.5 text-start transition-colors',
            isAll
              ? 'border-yellow-400 bg-yellow-400/5'
              : 'border-border hover:border-yellow-400/60'
          )}
        >
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
              isAll
                ? 'border-yellow-400 bg-yellow-400 text-black'
                : 'border-muted-foreground/40'
            )}
          >
            {isAll ? <Check className='h-3 w-3' /> : null}
          </span>
          <span className='text-sm font-medium'>{t('team.scopeAll')}</span>
        </button>

        {restaurants.map((r) => {
          const active = !isAll && (selected ?? []).includes(r.id);
          return (
            <button
              key={r.id}
              type='button'
              onClick={() => toggle(r.id)}
              aria-pressed={active}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 rounded-md border p-2.5 text-start transition-colors',
                active
                  ? 'border-yellow-400 bg-yellow-400/5'
                  : 'border-border hover:border-yellow-400/60'
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  active
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : 'border-muted-foreground/40'
                )}
              >
                {active ? <Check className='h-3 w-3' /> : null}
              </span>
              <span className='min-w-0 truncate text-sm'>{r.name}</span>
            </button>
          );
        })}
      </div>
      <p className='text-xs text-muted-foreground'>{t('team.scopeHint')}</p>
    </div>
  );
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function TeamSection({
  used,
  limit,
  members,
  invites,
  restaurants,
}: TeamSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  // The most recently generated invite (code + link) to surface for copying.
  const [freshInvite, setFreshInvite] = useState<TeamInviteView | null>(null);
  // Optional invitee prefill (invite-without-account, #13).
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [inviteePhone, setInviteePhone] = useState('');
  const [label, setLabel] = useState('');
  // Permissions granted to the invitee (default: full member set).
  const [invitePermissions, setInvitePermissions] = useState<MemberPermission[]>(
    [...DEFAULT_MEMBER_PERMISSIONS]
  );
  // Restaurants the invitee will be limited to. null = all (the default, which
  // preserves the previous behaviour for owners who ignore this control).
  const [inviteScope, setInviteScope] = useState<string[] | null>(null);

  const toggleInvitePermission = (key: MemberPermission) => {
    setInvitePermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const isStarter = limit === 0;
  const seatFull = used >= limit && limit > 0;
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const onGenerate = () => {
    startTransition(async () => {
      const res = await generateInvite({
        inviteeName,
        inviteeEmail,
        inviteePhone,
        label,
        permissions: invitePermissions,
        // Omitted when unscoped so the action stores NULL rather than [].
        restaurantIds: inviteScope ?? undefined,
      });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      setFreshInvite({ id: res.code, code: res.code, link: res.link });
      setInviteeName('');
      setInviteeEmail('');
      setInviteePhone('');
      setLabel('');
      setInvitePermissions([...DEFAULT_MEMBER_PERMISSIONS]);
      setInviteScope(null);
      toast.success(res.success);
      router.refresh();
    });
  };

  const onRevoke = (invitationId: string) => {
    startTransition(async () => {
      const res = await revokeInvite(invitationId);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      setFreshInvite((prev) => (prev?.id === invitationId ? null : prev));
      toast.success(res.success);
      router.refresh();
    });
  };

  const onRemove = (membershipId: string) => {
    startTransition(async () => {
      const res = await removeTeamMember(membershipId);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success);
      router.refresh();
    });
  };

  return (
    <Card className='rounded-xl border-border shadow-none'>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-3'>
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500'>
            <Users className='h-5 w-5' />
          </span>
          <h3 className='text-lg md:text-xl font-semibold'>
            {t('team.title')}
          </h3>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Utilisation des sièges */}
        <div>
          <div className='mb-1.5 flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>{t('team.seats')}</span>
            <span className='font-medium'>
              {used} / {limit}
            </span>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full bg-primary transition-all'
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {isStarter ? (
          <div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
            {t('team.starterHint')}
          </div>
        ) : (
          <div className='space-y-3'>
            {/* Optional: prefill the invitee's contact so the person is uniquely
                attached and can sign up + join from the link without an account. */}
            <div className='grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-name' className='text-xs text-muted-foreground'>
                  {t('team.invitee.name')}
                </Label>
                <Input
                  id='inv-name'
                  value={inviteeName}
                  onChange={(e) => setInviteeName(e.target.value)}
                  placeholder={t('team.invitee.namePh')}
                  disabled={isPending}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-role' className='text-xs text-muted-foreground'>
                  {t('team.invitee.role')}
                </Label>
                <Input
                  id='inv-role'
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t('team.invitee.rolePh')}
                  disabled={isPending}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-email' className='text-xs text-muted-foreground'>
                  {t('team.invitee.email')}
                </Label>
                <Input
                  id='inv-email'
                  type='email'
                  value={inviteeEmail}
                  onChange={(e) => setInviteeEmail(e.target.value)}
                  placeholder={t('team.invitee.emailPh')}
                  disabled={isPending}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-phone' className='text-xs text-muted-foreground'>
                  {t('team.invitee.phone')}
                </Label>
                <Input
                  id='inv-phone'
                  value={inviteePhone}
                  onChange={(e) => setInviteePhone(e.target.value)}
                  placeholder={t('team.invitee.phonePh')}
                  disabled={isPending}
                  // Phone numbers read left-to-right even in Arabic; without this
                  // the "+" and the digit groups reorder as you type.
                  dir='ltr'
                />
              </div>
              <p className='sm:col-span-2 text-xs text-muted-foreground'>
                {t('team.invitee.hint')}
              </p>

              {/* Permissions granted to this member. */}
              <div className='sm:col-span-2 space-y-2 border-t pt-3'>
                <p className='text-xs font-medium text-foreground'>
                  {t('team.permsTitle')}
                </p>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {MEMBER_PERMISSIONS.map((perm) => {
                    const active = invitePermissions.includes(perm.key);
                    return (
                      <button
                        key={perm.key}
                        type='button'
                        onClick={() => toggleInvitePermission(perm.key)}
                        aria-pressed={active}
                        disabled={isPending}
                        className={cn(
                          'flex items-start gap-2 rounded-md border p-2.5 text-left transition-colors',
                          active
                            ? 'border-yellow-400 bg-yellow-400/5'
                            : 'border-border hover:border-yellow-400/60'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            active
                              ? 'border-yellow-400 bg-yellow-400 text-black'
                              : 'border-muted-foreground/40'
                          )}
                        >
                          {active ? <Check className='h-3 w-3' /> : null}
                        </span>
                        <span className='min-w-0'>
                          <span className='block text-sm font-medium'>
                            {t(perm.labelKey)}
                          </span>
                          <span className='block text-xs text-muted-foreground'>
                            {t(perm.descriptionKey)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Which branches this person will work in. Area permissions alone
                  can't express "waiter at one restaurant only". */}
              <div className='sm:col-span-2'>
                <RestaurantScopePicker
                  restaurants={restaurants}
                  selected={inviteScope}
                  onChange={setInviteScope}
                  disabled={isPending}
                />
              </div>
            </div>

            <Button
              type='button'
              onClick={onGenerate}
              disabled={isPending || seatFull}
              className='w-full sm:w-auto'
            >
              {isPending ? (
                <Loader2 className='me-2 h-4 w-4 animate-spin' />
              ) : (
                <UserPlus className='me-2 h-4 w-4' />
              )}
              {t('team.generate')}
            </Button>
            {seatFull ? (
              <p className='text-xs text-muted-foreground'>
                {t('team.seatFull')}
              </p>
            ) : null}

            {/* Code fraîchement généré + lien copiable */}
            {freshInvite ? (
              <div className='rounded-md border bg-muted/40 p-3 space-y-2'>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-muted-foreground shrink-0'>
                    {t('team.code')}
                  </span>
                  {/* dir="ltr": the code is an opaque A-Z/2-9 token and the link
                      is a URL — both must not be re-ordered by the RTL context. */}
                  <span
                    className='select-all font-mono font-semibold'
                    dir='ltr'
                  >
                    {freshInvite.code}
                  </span>
                  <CopyIdButton value={freshInvite.code} />
                </div>
                <div className='flex items-center gap-2 text-xs'>
                  <span className='text-muted-foreground shrink-0'>
                    {t('team.link')}
                  </span>
                  <span className='truncate select-all font-mono' dir='ltr'>
                    {freshInvite.link}
                  </span>
                  <CopyIdButton value={freshInvite.link} />
                </div>
                <p className='text-xs text-muted-foreground'>
                  {t('team.codeHint')}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Invitations en attente */}
        {invites.length > 0 ? (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>{t('team.pending')}</h4>
            <ul className='space-y-2'>
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className='flex items-center justify-between gap-2 rounded-md border p-2.5'
                >
                  <div className='flex min-w-0 items-center gap-2 text-sm'>
                    <span
                      className='select-all font-mono font-medium'
                      dir='ltr'
                    >
                      {invite.code}
                    </span>
                    <CopyIdButton value={invite.link} />
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => onRevoke(invite.id)}
                    disabled={isPending}
                    className='text-destructive hover:text-destructive'
                  >
                    {t('team.revoke')}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Membres actuels */}
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>{t('team.members')}</h4>
          {members.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('team.noMembers')}
            </p>
          ) : (
            <ul className='space-y-2'>
              {members.map((member) => (
                <MemberRow
                  key={member.membershipId}
                  member={member}
                  restaurants={restaurants}
                  onRemove={() => onRemove(member.membershipId)}
                  disabled={isPending}
                />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * A member row with an inline, editable permission set (feature: edit member
 * permissions after adding them).
 */
function MemberRow({
  member,
  restaurants,
  onRemove,
  disabled,
}: {
  member: TeamMemberView;
  restaurants: TeamRestaurantView[];
  onRemove: () => void;
  disabled: boolean;
}) {
  const router = useRouter();
  // Its own translator: MemberRow is a separate component, so `t` from
  // TeamSection is not in scope here.
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [perms, setPerms] = useState<MemberPermission[]>(member.permissions);
  const [scope, setScope] = useState<string[] | null>(member.restaurantIds);
  const [isPending, startTransition] = useTransition();
  /**
   * Reset link most recently generated for this member.
   *
   * There is NO "show the password" option and there cannot be one: the DB only
   * stores a bcrypt hash. So the owner gets a one-time link the member uses to
   * choose their own password. Held in local state (never persisted) and only
   * for this row.
   */
  const [resetLink, setResetLink] = useState<string | null>(null);

  const toggle = (key: MemberPermission) => {
    setPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const onResetPassword = () => {
    startTransition(async () => {
      const res = await resetMemberPassword(member.membershipId);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      setResetLink(res.link);
      toast.success(res.success);
    });
  };

  const save = () => {
    startTransition(async () => {
      const res = await updateTeamMemberPermissions({
        membershipId: member.membershipId,
        permissions: perms,
        // Always sent from this form (even when unscoped) so clearing a member's
        // restriction actually clears it. `[]` normalizes to "all" server-side.
        restaurantIds: scope ?? [],
      });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success);
      setEditing(false);
      router.refresh();
    });
  };

  const busy = disabled || isPending;

  return (
    <li className='rounded-md border p-2.5'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-3'>
          <Avatar className='h-9 w-9'>
            {member.image ? (
              <AvatarImage src={member.image} alt={member.name ?? 'Avatar'} />
            ) : null}
            <AvatarFallback className='text-xs font-semibold'>
              {getInitials(member.name, member.email)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>
              {member.name ?? t('team.defaultUser')}
            </p>
            {/* Labelled "Identifiant" because this e-mail IS the login: the
                credentials provider resolves accounts by e-mail only. The owner
                needs to know what to tell their member to sign in with. */}
            <p className='truncate text-xs text-muted-foreground'>
              <span className='me-1'>{t('team.identifier')}</span>
              {/* dir="ltr" on the address itself: an e-mail is not RTL text. */}
              <span className='select-all font-mono' dir='ltr'>
                {member.email ?? '—'}
              </span>
            </p>
          </div>
        </div>
        <div className='flex shrink-0 flex-wrap items-center gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setEditing((v) => !v)}
            disabled={busy}
          >
            <ShieldCheck className='me-1.5 h-4 w-4' />
            {t('team.permissions')}
          </Button>
          {/* No confirmation dialog on purpose: the member's current password
              keeps working until the link is actually used, so clicking this by
              mistake locks nobody out. */}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onResetPassword}
            disabled={busy}
          >
            <KeyRound className='me-1.5 h-4 w-4' />
            {t('team.resetPassword')}
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onRemove}
            disabled={busy}
            className={cn('text-destructive hover:text-destructive')}
          >
            <Trash2 className='me-1.5 h-4 w-4' />
            {t('team.remove')}
          </Button>
        </div>
      </div>

      {/* Freshly generated reset link. Shown so the owner can pass it on in
          person when the e-mail didn't reach the member (staff often share one
          restaurant mailbox, and Resend is skipped entirely when unconfigured). */}
      {resetLink ? (
        <div className='mt-2 space-y-1.5 rounded-md border bg-muted/40 p-2.5'>
          <div className='flex items-center gap-2 text-xs'>
            <span className='shrink-0 text-muted-foreground'>
              {t('team.link')}
            </span>
            <span
              className='min-w-0 flex-1 truncate select-all font-mono'
              dir='ltr'
            >
              {resetLink}
            </span>
            <CopyIdButton value={resetLink} />
          </div>
          <p className='text-xs text-muted-foreground'>{t('team.resetHint')}</p>
        </div>
      ) : null}

      {/* Read-only permission summary when not editing. */}
      {!editing ? (
        <div className='mt-2 space-y-1 ps-12'>
          <p className='text-xs text-muted-foreground'>
            {perms.length === 0
              ? t('team.noPermission')
              : MEMBER_PERMISSIONS.filter((p) => perms.includes(p.key))
                  .map((p) => t(p.labelKey))
                  .join(' · ')}
          </p>
          {/* Only worth showing when there is more than one restaurant to be
              scoped to, and only when the member is actually restricted. */}
          {restaurants.length > 1 ? (
            <p className='text-xs text-muted-foreground'>
              {scope === null
                ? t('team.scopeAll')
                : restaurants
                    .filter((r) => scope.includes(r.id))
                    .map((r) => r.name)
                    .join(' · ')}
            </p>
          ) : null}
        </div>
      ) : (
        <div className='mt-3 space-y-3 border-t pt-3'>
          <div className='grid gap-2 sm:grid-cols-2'>
            {MEMBER_PERMISSIONS.map((perm) => {
              const active = perms.includes(perm.key);
              return (
                <button
                  key={perm.key}
                  type='button'
                  onClick={() => toggle(perm.key)}
                  aria-pressed={active}
                  disabled={busy}
                  className={cn(
                    'flex items-start gap-2 rounded-md border p-2.5 text-left transition-colors',
                    active
                      ? 'border-yellow-400 bg-yellow-400/5'
                      : 'border-border hover:border-yellow-400/60'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      active
                        ? 'border-yellow-400 bg-yellow-400 text-black'
                        : 'border-muted-foreground/40'
                    )}
                  >
                    {active ? <Check className='h-3 w-3' /> : null}
                  </span>
                  <span className='min-w-0'>
                    <span className='block text-sm font-medium'>
                      {t(perm.labelKey)}
                    </span>
                    <span className='block text-xs text-muted-foreground'>
                      {t(perm.descriptionKey)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <RestaurantScopePicker
            restaurants={restaurants}
            selected={scope}
            onChange={setScope}
            disabled={busy}
          />

          <div className='flex gap-2'>
            <Button type='button' size='sm' onClick={save} disabled={busy}>
              {isPending ? (
                <Loader2 className='me-2 h-4 w-4 animate-spin' />
              ) : null}
              {t('common.save')}
            </Button>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => {
                setPerms(member.permissions);
                setScope(member.restaurantIds);
                setEditing(false);
              }}
              disabled={busy}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
