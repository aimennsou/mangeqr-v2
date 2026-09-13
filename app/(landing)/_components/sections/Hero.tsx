import { ArrowRightIcon } from "lucide-react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import FadeUp from "../Fadeup";
import { Button } from "@/components/ui/button";
import { ExpandingDotButton } from "@/components/ui/expandingbutton";
import PhoneFrame from "../ui/PhoneFrame";
import LiveMenu from "../ui/LiveMenu";

export default function HeroSection() {
  return (
    <section id="hero" className="w-full">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-[16dvh] lg:grid-cols-2 lg:gap-8 lg:pt-[22dvh]">
        {/* Left column: copy + CTAs */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Badge variant="outline" className="animate-appear">
            <span className="border-r pr-2 text-muted-foreground">
              Digitalisez votre activité !
            </span>
            <a href="/auth/sign-up" className="ml-2 flex items-center gap-1">
              Commencer
              <ArrowRightIcon className="h-3 w-3" />
            </a>
          </Badge>

          <div className="relative pt-4">
            <FadeUp delay={0.2} duration={0.8}>
              <h1 className="font-serif-display text-center text-5xl font-light leading-[1.05] tracking-[-0.05em] sm:text-6xl md:text-7xl lg:text-left lg:text-8xl">
                Créez des Menus
                <span className="italic font-medium text-yellow-400"> QR </span>
                en 2 minutes !
              </h1>
            </FadeUp>
            <FadeUp delay={0.4} duration={0.8}>
              <p className="mx-auto mt-6 max-w-xl text-base font-light tracking-tight dark:text-zinc-300 sm:text-lg lg:mx-0">
                Créez des menus{" "}
                <span className="inline font-semibold">
                  numériques et physiques
                </span>
                , obtenez des avis clients et lancez des campagnes marketing !
              </p>
            </FadeUp>
            <FadeUp delay={0.6} duration={1}>
              <div className="mt-8 flex items-center justify-center gap-3 lg:justify-start">
                <Link href="/artisto" passHref>
                  <Button variant={"ghost"} size={"lg"}>
                    Voir un vrai menu
                  </Button>
                </Link>

                <Link href={`/auth/sign-up`}>
                  <ExpandingDotButton
                    size="lg"
                    className="cursor-pointer bg-yellow-400 text-black hover:bg-yellow-400"
                  >
                    Creer un menu
                  </ExpandingDotButton>
                </Link>
              </div>
            </FadeUp>

            {/* Stats strip (mirrors the reference "+22% / 10s" row) */}
            <FadeUp delay={0.8} duration={1}>
              <div className="mt-10 flex items-center justify-center gap-10 border-t pt-6 lg:justify-start">
                <div>
                  <p className="text-2xl font-semibold">+22%</p>
                  <p className="text-xs text-muted-foreground">
                    de clients fidélisés
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">10s</p>
                  <p className="text-xs text-muted-foreground">
                    pour mettre à jour
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">2 400+</p>
                  <p className="text-xs text-muted-foreground">
                    restaurants
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>

        {/* Right column: phone with the live, explorable menu */}
        <FadeUp delay={0.4} duration={0.9}>
          <div className="relative flex justify-center lg:justify-end">
            {/* "Try it!" dashed accent, matching the reference */}
            <div className="absolute -right-2 top-6 z-10 hidden h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-yellow-400 bg-yellow-100/60 text-sm font-semibold text-yellow-700 lg:flex">
              Essayez !
            </div>
            <PhoneFrame>
              <LiveMenu />
            </PhoneFrame>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
