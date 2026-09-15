import Reveal from './Reveal';
import V2Button from './V2Button';

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
            Votre première carte, en quelques minutes.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg leading-relaxed text-black/70">
            Créez votre compte, ajoutez votre premier restaurant et publiez un
            menu que vous pourrez modifier en dix secondes.
          </p>
          <div className="mt-10 flex items-center justify-center">
            <V2Button
              href="/auth/sign-up"
              variant="dark"
              className="w-full sm:w-auto"
            >
              Commencer maintenant
            </V2Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
