'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';

/**
 * Scroll-reveal wrapper for the /v2 landing.
 *
 * Entrance = short travel (≤14px) + fade, ease-out, once. Honors
 * prefers-reduced-motion per WCAG 2.3.3: when the user opts out we drop the
 * translate and keep an opacity-only fade, so the feedback survives without the
 * movement. (The main landing's FadeUp does not do this — Reveal is the v2
 * coherent replacement.)
 */
export default function Reveal({
  children,
  delay = 0,
  className
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduce ? 0.2 : 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
