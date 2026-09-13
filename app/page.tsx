

import Hero  from './(landing)/_components/sections/Hero';
import Footer from '@/components/footer';
import { Navbar } from './(landing)/_components/sections/Navbar';
import FAQ from './(landing)/_components/sections/faq';
import BentoGrid from './(landing)/_components/sections/bento';
import Powered from './(landing)/_components/sections/Coming';
import FeaturesSection from './(landing)/_components/sections/features-section';
import LinkInBio from './(landing)/_components/sections/LinkInBio';
import MarketingTool from './(landing)/_components/sections/MarketingTool';
import CardEditor from './(landing)/_components/sections/CardEditor';
import GooglePresence from './(landing)/_components/sections/GooglePresence';
import CalltoAction from './(landing)/_components/sections/cta';
import ScrollToTopButton from './(landing)/_components/sections/scrollup';


export default function HomePage() {


  return (
    <>
    <Navbar/>
      <main className='flex  h-full min-h-[calc(100vh_-_36px_-_48px)] flex-col items-center justify-center'>
 <Hero/>
 <MarketingTool/>
 <CardEditor/>
 <GooglePresence/>

<FeaturesSection/>

<LinkInBio/>

 <FAQ/>
<CalltoAction/>
      </main>
      <ScrollToTopButton/>
      <Footer />
    </>
  );
}
