import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";

import PhoneFrame from "../ui/PhoneFrame";
import LiveMenu from "../ui/LiveMenu";
import FadeUp from "../Fadeup";

// Channels where the restaurateur can drop their shareable menu link.
const CHANNELS = [
  {
    icon: FaInstagram,
    tile: "bg-gradient-to-br from-fuchsia-500 via-red-500 to-yellow-400 text-white",
    title: "Bio Instagram",
    sample: "monresto.mangeqr.com",
  },
  {
    icon: FaTiktok,
    tile: "bg-black text-white",
    title: "Profil TikTok",
    sample: "monresto.mangeqr.com",
  },
  {
    icon: FaWhatsapp,
    tile: "bg-green-500 text-white",
    title: "Réponse WhatsApp Business",
    sample: "monresto.mangeqr.com",
  },
];

export default function LinkInBio() {
  return (
    <section id="link-in-bio" className="w-full px-6 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: copy + channel cards */}
        <div>
          <FadeUp delay={0.1} duration={0.7}>
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-500">
              Instagram · Lien dans la bio
            </p>
          </FadeUp>

          <FadeUp delay={0.2} duration={0.8}>
            <h2 className="font-serif-display mt-4 text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Le lien de votre bio devrait montrer le menu du jour, pas un PDF
              figé.
            </h2>
          </FadeUp>

          <FadeUp delay={0.3} duration={0.8}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Mettez votre lien MangeQR dans votre bio Instagram, TikTok,
              WhatsApp Business ou Facebook — partout où vos clients vous
              trouvent. Un seul clic, et ils consultent le menu du jour.
            </p>
          </FadeUp>

          <div className="mt-8 space-y-3">
            {CHANNELS.map((c, i) => (
              <FadeUp key={c.title} delay={0.4 + i * 0.1} duration={0.7}>
                <div className="group flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${c.tile}`}
                  >
                    <c.icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900">{c.title}</p>
                    <p className="truncate font-mono text-sm text-muted-foreground">
                      {c.sample}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1" />
                </div>
              </FadeUp>
            ))}
          </div>
        </div>

        {/* Right: phone with the live menu */}
        <FadeUp delay={0.3} duration={0.9}>
          <div className="flex justify-center lg:justify-end">
            <PhoneFrame>
              <LiveMenu />
            </PhoneFrame>
          </div>
        </FadeUp>
      </div>

      {/* CTA */}
      <FadeUp delay={0.5} duration={0.8}>
        <div className="mt-14 flex justify-center">
          <Link
            href="/auth/sign-up"
            className="group inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-400/30 transition-transform hover:scale-[1.03]"
          >
            Obtenez votre lien de menu partageable
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </FadeUp>
    </section>
  );
}
