import { Hero } from './_components/Hero';
import { ProofStrip } from './_components/ProofStrip';
import { Problem } from './_components/Problem';
import { Mechanism } from './_components/Mechanism';
import { Offer } from './_components/Offer';
import { Demo } from './_components/Demo';
import { Testimonials } from './_components/Testimonials';
import { ValueStack } from './_components/ValueStack';
import { PricingROI } from './_components/PricingROI';
import { Objections } from './_components/Objections';
import { Guarantee } from './_components/Guarantee';
import { FAQ } from './_components/FAQ';
import { FinalCTA } from './_components/FinalCTA';
import { Footer } from './_components/Footer';

/**
 * Arabic (RTL) conversion-focused landing page for paid ads.
 *
 * Follows the Hormozi high-performance structure, engineering the value
 * equation at each stage: big promise → immediate proof → problem → new
 * mechanism → offer → demo → social proof → value stack → price/ROI →
 * objections → guarantee → FAQ → final CTA. The primary CTA (sign-up) repeats
 * at the hero, after the demo, in the value stack, ROI, and final sections.
 *
 * The /lp layout forces RTL + Arabic font and strips the app chrome.
 */
export default function ArabicLandingPage() {
  return (
    <main>
      <Hero />
      <ProofStrip />
      <Problem />
      <Mechanism />
      <Offer />
      <Demo />
      <Testimonials />
      <ValueStack />
      <PricingROI />
      <Objections />
      <Guarantee />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
