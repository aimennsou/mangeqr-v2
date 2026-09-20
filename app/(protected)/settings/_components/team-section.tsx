'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  generateInvite,
  revokeInvite,
  removeTeamMember,
} from '@/actions/team';
import CopyIdButton from './copy-id-button';

export interface TeamMemberView {
  membershipId: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface TeamInviteView {
  id: string;
  code: string;
  link: string;
}

interface TeamSectionProps {
  used: number;
  limit: number;
  members: TeamMemberView[];
  invites: TeamInviteView[];
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
}: TeamSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // The most recently generated invite (code + link) to surface for copying.
  const [freshInvite, setFreshInvite] = useState<TeamInviteView | null>(null);
  // Optional invitee prefill (invite-without-account, #13).
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [inviteePhone, setInviteePhone] = useState('');
  const [label, setLabel] = useState('');

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
          <h3 className='text-lg md:text-xl font-semibold'>Équipe</h3>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Utilisation des sièges */}
        <div>
          <div className='mb-1.5 flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Collaborateurs</span>
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
            Votre plan actuel n&apos;inclut aucun collaborateur. Passez à un plan
            supérieur (Pro ou Premium) pour inviter votre équipe à gérer vos
            menus.
          </div>
        ) : (
          <div className='space-y-3'>
            {/* Optional: prefill the invitee's contact so the person is uniquely
                attached and can sign up + join from the link without an account. */}
            <div className='grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-name' className='text-xs text-muted-foreground'>
                  Nom (optionnel)
                </Label>
                <Input
                  id='inv-name'
                  value={inviteeName}
                  onChange={(e) => setInviteeName(e.target.value)}
                  placeholder='Jean Dupont'
                  disabled={isPending}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-role' className='text-xs text-muted-foreground'>
                  Rôle / poste (optionnel)
                </Label>
                <Input
                  id='inv-role'
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder='Serveur, responsable…'
                  disabled={isPending}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-email' className='text-xs text-muted-foreground'>
                  Email (optionnel)
                </Label>
                <Input
                  id='inv-email'
                  type='email'
                  value={inviteeEmail}
                  onChange={(e) => setInviteeEmail(e.target.value)}
                  placeholder='invite@exemple.com'
                  disabled={isPending}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='inv-phone' className='text-xs text-muted-foreground'>
                  Téléphone (optionnel)
                </Label>
                <Input
                  id='inv-phone'
                  value={inviteePhone}
                  onChange={(e) => setInviteePhone(e.target.value)}
                  placeholder='+213 …'
                  disabled={isPending}
                />
              </div>
              <p className='sm:col-span-2 text-xs text-muted-foreground'>
                Le lien généré permet à la personne de créer un compte et de
                rejoindre directement votre espace, même sans compte existant.
              </p>
            </div>

            <Button
              type='button'
              onClick={onGenerate}
              disabled={isPending || seatFull}
              className='w-full sm:w-auto'
            >
              {isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <UserPlus className='mr-2 h-4 w-4' />
              )}
              Générer un lien d&apos;invitation
            </Button>
            {seatFull ? (
              <p className='text-xs text-muted-foreground'>
                Limite de collaborateurs atteinte. Retirez un membre pour en
                inviter un autre.
              </p>
            ) : null}

            {/* Code fraîchement généré + lien copiable */}
            {freshInvite ? (
              <div className='rounded-md border bg-muted/40 p-3 space-y-2'>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-muted-foreground shrink-0'>Code ·</span>
                  <span className='select-all font-mono font-semibold'>
                    {freshInvite.code}
                  </span>
                  <CopyIdButton value={freshInvite.code} />
                </div>
                <div className='flex items-center gap-2 text-xs'>
                  <span className='text-muted-foreground shrink-0'>Lien ·</span>
                  <span className='truncate select-all font-mono'>
                    {freshInvite.link}
                  </span>
                  <CopyIdButton value={freshInvite.link} />
                </div>
                <p className='text-xs text-muted-foreground'>
                  Ce code est à usage unique et expire dans 7 jours.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Invitations en attente */}
        {invites.length > 0 ? (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Invitations en attente</h4>
            <ul className='space-y-2'>
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className='flex items-center justify-between gap-2 rounded-md border p-2.5'
                >
                  <div className='flex min-w-0 items-center gap-2 text-sm'>
                    <span className='select-all font-mono font-medium'>
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
                    Révoquer
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Membres actuels */}
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>Membres</h4>
          {members.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Aucun collaborateur pour le moment.
            </p>
          ) : (
            <ul className='space-y-2'>
              {members.map((member) => (
                <li
                  key={member.membershipId}
                  className='flex items-center justify-between gap-2 rounded-md border p-2.5'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <Avatar className='h-9 w-9'>
                      {member.image ? (
                        <AvatarImage
                          src={member.image}
                          alt={member.name ?? 'Avatar'}
                        />
                      ) : null}
                      <AvatarFallback className='text-xs font-semibold'>
                        {getInitials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>
                        {member.name ?? 'Utilisateur'}
                      </p>
                      <p className='truncate text-xs text-muted-foreground'>
                        {member.email ?? '—'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => onRemove(member.membershipId)}
                    disabled={isPending}
                    className={cn('text-destructive hover:text-destructive')}
                  >
                    <Trash2 className='mr-1.5 h-4 w-4' />
                    Retirer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
