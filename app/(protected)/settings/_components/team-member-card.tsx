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
    <Card className='rounded-lg'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Users className='h-5 w-5 text-muted-foreground' />
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
