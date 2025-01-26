
import { ArrowRightIcon, CheckCheck, ChevronRight, Star } from "lucide-react";



import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Safari } from "@/components/safari";
import FadeUp from "../Fadeup";
import { Button } from "@/components/ui/button";
import { ExpandingDotButton } from "@/components/ui/expandingbutton";






export default function HeroSection() {

 

      
    return (
        <section id="hero" className="">
  
            <div className=" ">
                <div className="mx-auto flex max-w-7xl flex-col items-center space-y-2 pb-10 pt-[32dvh] text-center">
                <Badge variant="outline" className="animate-appear ">
    <span className="text-muted-foreground pr-2 border-r ">
      Digitalisez votre activité !
    </span>
    <a href="/auth/sign-up" className="flex items-center  ml-2 gap-1">
      Commencer
      <ArrowRightIcon className="h-3 w-3" />
    </a>
  </Badge>

                    <div className="relative pt-4">
                        <FadeUp delay={0.2} duration={0.8}>
                            <h1 className=" bg-clip-text text-center text-3xl font-bold tracking-tight dark:from-white dark:via-neutral-200 dark:to-black/[0.6] sm:text-center sm:text-4xl md:text-6xl">
                            Créez des Menus<span className="text-yellow-400">  QR  </span>en 2 minutes !
                            </h1>
                        </FadeUp>
                        <FadeUp delay={0.4} duration={0.8}>
                            <p className="mx-auto mt-6 max-w-2xl text-base font-light tracking-tight dark:text-zinc-300 sm:text-xl">
                               
                             
                               
                             Créez des menus{' '}
                                <span className="inline font-semibold">numériques et physiques</span> , obtenez des avis clients et lancez des campagnes marketing !
                            </p>
                        </FadeUp>
                        <FadeUp delay={0.6} duration={1}>
                            <div className="mt-6 flex items-center justify-center gap-3">
                                <Link href="/artisto" passHref>
                                <Button 
      variant={'ghost'} 
      size={'lg'} 

    >
     Voir un vrai menu
    </Button>
                                </Link>
                      
        <Link href={`/auth/sign-up`}>
                        <ExpandingDotButton size="lg"  className="bg-yellow-400 text-black cursor-pointer hover:bg-yellow-400">
                     
                            Creer un menu
                        </ExpandingDotButton>
                    </Link>  
                       
                            </div>
                         
                        </FadeUp>


                
                    </div>
        
                </div>
            </div>

        </section>
    )
}