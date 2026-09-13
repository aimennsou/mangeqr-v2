import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Reveal from './Reveal';

/**
 * Closing marquee band. The one place the gold becomes a full surface, so the
 * final call to action lands with weight against the otherwise cream/white
 * page. Off-black text on gold keeps contrast well above AA.
 */
export default function V2Cta() {
  return (
    <section className="px-6 py-24 lg:py-32">
      <Reveal>
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-yellow-400 px-8 py-20 text-center sm:px-16">
          <h2 className="font-serif-display mx-auto max-w-[18ch] text-4xl font-light leading-[1.05] tracking-[-0.02em] text-black sm:text-6xl">
            Votre première carte est gratuite.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg leading-relaxed text-black/70">
            Créez votre compte, ajoutez votre premier restaurant et publiez un
            menu que vous pourrez modifier en dix secondes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="group w-full bg-black text-white hover:bg-black/90 sm:w-auto"
              >
                Commencer maintenant
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/artisto">
              <Button
                size="lg"
                variant="ghost"
                className="w-full text-black hover:bg-black/10 sm:w-auto"
              >
                Voir un vrai menu
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
