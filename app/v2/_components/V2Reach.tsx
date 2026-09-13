import { ArrowRight } from 'lucide-react';
import { FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';

import PhoneFrame from '../../(landing)/_components/ui/PhoneFrame';
import LiveMenu from '../../(landing)/_components/ui/LiveMenu';
import Reveal from './Reveal';
import V2Button from './V2Button';

// Channels where the restaurateur drops their shareable menu link.
const CHANNELS = [
  {
    icon: FaInstagram,
    tile: 'bg-gradient-to-br from-fuchsia-500 via-red-500 to-yellow-400 text-white',
    title: 'Bio Instagram',
    sample: 'monresto.mangeqr.com'
  },
  {
    icon: FaTiktok,
    tile: 'bg-black text-white',
    title: 'Profil TikTok',
    sample: 'monresto.mangeqr.com'
  },
  {
    icon: FaWhatsapp,
    tile: 'bg-green-500 text-white',
    title: 'Réponse WhatsApp Business',
    sample: 'monresto.mangeqr.com'
  }
];

/**
 * Link-in-bio section. Asymmetric split: editorial copy + branded channel rows
 * on the left, the live phone on the right, then a big shareable-link CTA.
 */
export default function V2Reach() {
  return (
    <section className="border-t border-border px-6 py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: copy + channel cards */}
        <div>
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Instagram · Lien dans la bio
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="font-serif-display mt-4 max-w-[18ch] text-4xl font-light leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl">
              Le lien de votre bio devrait montrer le menu du jour, pas un PDF
              figé.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[54ch] text-lg font-light leading-relaxed text-muted-foreground">
              Mettez votre lien MangeQR dans votre bio Instagram, TikTok,
              WhatsApp Business ou Facebook, partout où vos clients vous
              trouvent. Un seul clic, et ils consultent le menu du jour.
            </p>
          </Reveal>

          <div className="mt-8 space-y-3">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon;
              return (
                <Reveal key={c.title} delay={0.15 + i * 0.06}>
                  <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-yellow-400">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${c.tile}`}
                    >
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{c.title}</p>
                      <p className="truncate font-mono text-sm text-muted-foreground">
                        {c.sample}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Right: phone with the live menu */}
        <Reveal delay={0.1}>
          <div className="flex justify-center lg:justify-end">
            <PhoneFrame>
              <LiveMenu />
            </PhoneFrame>
          </div>
        </Reveal>
      </div>

      {/* CTA */}
      <Reveal delay={0.1}>
        <div className="mt-14 flex justify-center">
          <V2Button href="/auth/sign-up">
            Obtenez votre lien de menu partageable
          </V2Button>
        </div>
      </Reveal>
    </section>
  );
}
