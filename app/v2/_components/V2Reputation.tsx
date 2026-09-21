'use client';

import { Star, ThumbsUp, ShieldCheck, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import Reveal from './Reveal';
import V2Button from './V2Button';

const POINTS = [
  {
    icon: ThumbsUp,
    title: 'Les avis positifs vers Google',
    desc: 'Les clients satisfaits (4-5★) sont dirigés vers votre fiche Google en un geste — plus d’étoiles, meilleur classement.',
  },
  {
    icon: ShieldCheck,
    title: 'Les retours négatifs en privé',
    desc: 'Une expérience mitigée est captée en interne, pas publiquement, pour vous laisser la chance de corriger le tir.',
  },
  {
    icon: MessageSquare,
    title: 'Un canal de contact direct',
    desc: 'Le client laisse son email ou téléphone : vous le recontactez et transformez un mécontent en habitué.',
  },
];

/**
 * "Gérez votre réputation" — a big, visual section built around the review flow
 * MangeQR already ships (positive → Google, negative → captured privately),
 * with a mock review card on one side and the value points on the other.
 */
export default function V2Reputation() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-16 lg:py-32">
        {/* Left: copy + points */}
        <div>
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Réputation
            </p>
            <h2 className="font-serif-display mt-4 max-w-[18ch] text-4xl font-light leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl">
              Gérez votre réputation, avis après avis.
            </h2>
            <p className="mt-6 max-w-[54ch] text-lg font-light leading-relaxed text-muted-foreground">
              Collectez les avis via un simple QR code et orientez-les
              intelligemment : plus de 5 étoiles sur Google, moins de mauvaises
              surprises en public.
            </p>
          </Reveal>

          <div className="mt-8 space-y-3">
            {POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={0.1 + i * 0.06}>
                  <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{p.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <V2Button href="/auth/sign-up">Collecter plus d’avis</V2Button>
            </div>
          </Reveal>
        </div>

        {/* Right: mock review card */}
        <Reveal delay={0.1}>
          <div className="relative mx-auto w-full max-w-md">
            {/* Soft gold wash behind the card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-yellow-400/15 blur-2xl"
            />
            <div className="relative rounded-3xl border border-border bg-background p-6 shadow-xl">
              <p className="text-lg font-semibold text-foreground">
                Laissez un avis
              </p>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      'h-9 w-9',
                      n <= 5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                    )}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Merci ! Partagez votre expérience sur Google pour soutenir le
                restaurant.
              </p>
              <div className="mt-4 rounded-xl bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-black">
                Laisser mon avis sur Google
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Note moyenne
                  </span>
                  <span className="font-serif-display text-2xl font-light text-foreground">
                    4.8<span className="text-yellow-500">★</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
