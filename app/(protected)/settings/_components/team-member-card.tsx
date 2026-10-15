'use client';

import { Users } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

interface TeamMemberCardProps {
  ownerName: string | null;
}

/**
 * Read-only "Équipe" card shown to MEMBERS (mangeqr-team, R5.2). Members have no
 * invite controls; they only see which workspace they belong to.
 *
 * A client component so its copy follows a language switch immediately. It was a
 * server component with hardcoded French, which meant a member on an Arabic UI
 * saw a French card.
 */
export default function TeamMemberCard({ ownerName }: TeamMemberCardProps) {
  const { t } = useI18n();

  return (
    <Card className='rounded-xl border-border shadow-none'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500'>
            <Users className='h-5 w-5' />
          </span>
          <h3 className='text-lg md:text-xl font-semibold'>
            {t('team.title')}
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>
          {/* The owner's name is user data, so it goes through a {name}
              placeholder rather than being concatenated — each language keeps its
              own word order. */}
          {ownerName
            ? t('team.memberOf').replace('{name}', ownerName)
            : t('team.memberOfGeneric')}
        </p>
      </CardContent>
    </Card>
  );
}
