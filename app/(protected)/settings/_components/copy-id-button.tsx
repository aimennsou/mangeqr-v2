'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

interface CopyIdButtonProps {
  value: string;
  className?: string;
}

export default function CopyIdButton({ value, className }: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Identifiant copié.');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Impossible de copier l'identifiant.");
    }
  };

  return (
    <button
      type='button'
      onClick={onCopy}
      aria-label="Copier l'identifiant"
      title="Copier l'identifiant"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
    >
      {copied ? (
        <Check className='h-3.5 w-3.5' />
      ) : (
        <Copy className='h-3.5 w-3.5' />
      )}
    </button>
  );
}
