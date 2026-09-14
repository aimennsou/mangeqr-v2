import { Users } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TeamMemberCardProps {
  ownerName: string | null;
}

/**
 * Read-only "Équipe" card shown to MEMBERS (mangeqr-team, R5.2). Members have no
 * invite controls; they only see which workspace they belong to.
 */
export default function TeamMemberCard({ ownerName }: TeamMemberCardProps) {
  return (
    <Card className='rounded-xl border-border shadow-none'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500'>
            <Users className='h-5 w-5' />
          </span>
          <h3 className='text-lg md:text-xl font-semibold'>Équipe</h3>
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>
          {ownerName
            ? `Vous êtes membre de l'espace de ${ownerName}.`
            : "Vous êtes membre d'un espace de travail."}
        </p>
      </CardContent>
    </Card>
  );
}
