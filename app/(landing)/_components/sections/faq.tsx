// React and Next.js imports
import React from "react";

// Third-party library imports
import { ArrowUpRight } from "lucide-react";

// UI component imports
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FadeUp from "../Fadeup";



// Custom components


type FAQItem = {
  question: string;
  answer: string;
  link?: string;
};

const content: FAQItem[] = [
  {
    question: "Est-ce que MangeQR est une application ?",
    answer:
      "MangeQR n'est pas une application native : cela signifie que vos clients ne devront pas passer par l'App Store. Dès qu'ils scannent le code QR, ils sont redirigés vers un site web contenant le menu du restaurant.",
  },
  {
    question: "Est-il facile de créer un menu avec QR ?",
    answer:
      "Oui, bien sûr. MangeQR est très facile à utiliser et vous permet de créer un menu numérique sans nécessairement avoir des connaissances en programmation ou en design. MangeQR vous permet d'ajouter des plats et des sections, comme des entrées ou des plats principaux. Une fois les modifications sauvegardées, le menu est mis à jour et synchronisé avec le code QR des tables.",
  },
  {
    question: "Puis-je changer les prix ou les plats après la création de mon menu ?",
    answer:
      "Vous pouvez modifier tous les détails du menu quand vous le souhaitez. Un plat n'est plus disponible ? Il suffit d'aller dans le panneau de contrôle et de le cacher du menu pour que les clients ne puissent pas le commander.",
  },
  {
    question: "Comment puis-je recevoir mes QR codes ?",
    answer:
      "Dans la version BETA, nous vous enverrons un échantillon de stand QR code pour que vous puissiez essayer les services MangeQR. De plus, vous pouvez télécharger les QR codes en format JPEG ou PDF directement via votre espace personnel.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="container mx-auto max-w-7xl px-4 py-16">
    
    <FadeUp duration={0.8} delay={0.1}>
        <h2 className="mb-8 text-center text-3xl font-bold">Questions fréquemment posées</h2>
      </FadeUp>



        <div className="not-prose mt-4 flex flex-col gap-4 md:mt-8">
          {content.map((item, index) => (
            <Accordion key={index} type="single" collapsible>
              <AccordionItem
                value={item.question}
                className="rounded-md border bg-muted/20 px-4 transition-all hover:bg-muted/50"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-base md:w-3/4">
                  {item.answer}
                  {item.link && (
                    <a
                      href={item.link}
                      className="mt-2 flex w-full items-center opacity-60 transition-all hover:opacity-100"
                    >
                      Learn more <ArrowUpRight className="ml-1" size="16" />
                    </a>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>

    </section>
  );
};

export default FAQ;
