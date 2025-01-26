

import Hero  from './(landing)/_components/sections/Hero';
import Footer from '@/components/footer';
import { Navbar } from './(landing)/_components/sections/Navbar';
import PreviewLanding from './(landing)/_components/sections/Preview';
import FAQ from './(landing)/_components/sections/faq';
import BentoGrid from './(landing)/_components/sections/bento';
import Powered from './(landing)/_components/sections/Coming';
import FeaturesSection from './(landing)/_components/sections/features-section';
import CalltoAction from './(landing)/_components/sections/cta';
import ScrollToTopButton from './(landing)/_components/sections/scrollup';


export default function HomePage() {


  return (
    <>
    <Navbar/>
      <main className='flex  h-full min-h-[calc(100vh_-_36px_-_48px)] flex-col items-center justify-center'>
 <Hero/>
 <PreviewLanding/>

<FeaturesSection/>

 <FAQ/>
<CalltoAction/>
      </main>
      <ScrollToTopButton/>
      <Footer />
    </>
  );
}
