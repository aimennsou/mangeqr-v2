'use client';

import { type RefObject } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { useI18n } from '@/lib/i18n';

/**
 * Fullscreen toggle for the Commandes / Cuisine / Plan de salle boards.
 *
 * Targets a container element (passed by ref) so only that board fills the
 * screen — handy on a counter/kitchen display. Hides itself when the browser
 * doesn't support the Fullscreen API. The container is responsible for the
 * fullscreen background/padding (it gets a real fullscreen element, which is
 * transparent by default).
 */
export default function FullscreenButton({
  target
}: {
  target: RefObject<HTMLElement>;
}) {
  const { t } = useI18n();
  const { isFullscreen, toggle, supported } = useFullscreen(target);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      title={isFullscreen ? t('fullscreen.exit') : t('fullscreen.enter')}
      aria-label={isFullscreen ? t('fullscreen.exit') : t('fullscreen.enter')}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      )}
    </Button>
  );
}
