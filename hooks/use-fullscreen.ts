'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';

/**
 * Toggle native fullscreen for a specific element (a board/editor container),
 * with vendor-prefix fallbacks (Safari/older WebKit) and a `keydown`-free,
 * event-driven `isFullscreen` state that stays correct even when the user
 * exits with Esc or the browser UI.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { isFullscreen, toggle, supported } = useFullscreen(ref);
 *   ...
 *   <div ref={ref}>...<button onClick={toggle} /></div>
 */

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}
interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}

function currentFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const d = document as FullscreenDocument;
  return (
    d.fullscreenElement ??
    d.webkitFullscreenElement ??
    d.msFullscreenElement ??
    null
  );
}

export function useFullscreen(target: RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(true);

  // Keep state in sync with the browser, including Esc / native-UI exits.
  useEffect(() => {
    const el = target.current;
    setSupported(
      typeof document !== 'undefined' &&
        (!!document.documentElement.requestFullscreen ||
          !!(el as FullscreenElement | null)?.webkitRequestFullscreen)
    );

    const onChange = () => {
      const fsEl = currentFullscreenElement();
      setIsFullscreen(!!fsEl && fsEl === target.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    onChange();
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [target]);

  const enter = useCallback(async () => {
    const el = target.current as FullscreenElement | null;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch {
      /* user gesture / permission issue — ignore */
    }
  }, [target]);

  const exit = useCallback(async () => {
    const d = document as FullscreenDocument;
    try {
      if (d.exitFullscreen) await d.exitFullscreen();
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
      else if (d.msExitFullscreen) await d.msExitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    if (currentFullscreenElement() === target.current) {
      void exit();
    } else {
      void enter();
    }
  }, [enter, exit, target]);

  return { isFullscreen, toggle, enter, exit, supported };
}
