import { Lock } from 'lucide-react';

/**
 * Shown to diners when a restaurant's public menu is unavailable because the
 * owner's FREE trial has ended. Neutral, on-brand, and non-technical — it
 * simply tells the visitor the menu is temporarily unavailable and nudges the
 * owner (who may be looking) to upgrade to the Starter plan.
 */
export function MenuUnavailable({
  name,
  reason = 'trial',
}: {
  name: string;
  /**
   * Why the view is unavailable. `trial` (default) means the owner's free
   * trial ended; `feature` means the display feature (borne/TV) is not
   * activated for this account.
   */
  reason?: 'trial' | 'feature';
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-6 py-16 dark:bg-neutral-950">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
          <Lock className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-serif-display text-3xl font-light tracking-tight text-foreground">
          {name}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {reason === 'feature'
            ? "Cet affichage n'est pas disponible pour le moment."
            : "Ce menu n'est pas disponible pour le moment."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {reason === 'feature'
            ? "Cette fonctionnalité n'est pas activée pour ce compte. Contactez MangeQR pour l'activer."
            : "La période d'essai gratuite de ce restaurant est terminée. Pour réactiver ce menu, le restaurateur doit passer au forfait Starter."}
        </p>
      </div>
    </div>
  );
}
