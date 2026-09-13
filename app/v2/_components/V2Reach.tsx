import { Instagram, MapPin } from 'lucide-react';

import Reveal from './Reveal';

/**
 * Full-width band that resets the rhythm after the feature index. Editorial
 * stack: a centered statement, then two offset panels (Google Maps + link in
 * bio) sharing one shareable URL idea.
 */
export default function V2Reach() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <div className="mx-auto max-w-[42ch] text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Soyez trouvé. Soyez choisi.
            </p>
            <h2 className="font-serif-display mt-4 text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              Un seul lien. Partout où vos clients vous cherchent.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal>
            <article className="h-full rounded-2xl border border-border bg-card p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                <MapPin className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-6 text-xl font-semibold text-foreground">
                Google Maps et Business
              </h3>
              <p className="mt-2 max-w-[52ch] leading-relaxed text-muted-foreground">
                Collez votre lien de carte directement dans votre profil Google
                Business. Le bouton « Afficher la carte » pointe vers une page
                toujours à jour, au lieu d&apos;un PDF cassé.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground">
                <span className="text-muted-foreground">↳</span>
                monresto.mangeqr.com/menu
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.06}>
            <article className="h-full rounded-2xl border border-border bg-card p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                <Instagram className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-6 text-xl font-semibold text-foreground">
                Le lien dans la bio
              </h3>
              <p className="mt-2 max-w-[52ch] leading-relaxed text-muted-foreground">
                Instagram, TikTok, WhatsApp Business, Facebook. Un seul clic et
                vos clients consultent le menu du jour, pas un fichier figé
                d&apos;il y a six mois.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Bio Instagram', 'Profil TikTok', 'WhatsApp Business'].map(
                  (c) => (
                    <span
                      key={c}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {c}
                    </span>
                  )
                )}
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
