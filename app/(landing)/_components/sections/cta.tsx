

import { ExpandingDotButton } from '@/components/ui/expandingbutton';
import Link from 'next/link';

export default function CalltoAction() {
  return (
    <section id="cta" className=" flex flex-col gap-16 my-14 xl:flex-row">
    <div className="relative flex flex-1 items-center">
      <div className="relative flex flex-col gap-16 rounded-3xl  px-7 py-8 " style={{ width: '100%' }}>
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
    
          </div>
          <h1 className=" justify-center whitespace-normal max-w-full mx-auto text-center text-4xl font-black tracking-tight sm:text-5xl md:text-[4.5rem] md:leading-[4.5rem] lg:text-6xl xl:max-w-[43.5rem] xl:text-6xl">
          Lancez votre aventure avec MangeQR dès maintenant !
          </h1>
        </div>
      
        <div className="flex flex-col items-center"> {/* Center the button */}
        <Link href={`/auth/sign-up`}>
                        <ExpandingDotButton size="lg"  className="bg-yellow-400 text-black cursor-pointer hover:bg-yellow-400">
                     
                            Commencer maintenant
                        </ExpandingDotButton>
                    </Link>  
        </div>
    
         
      </div>
    </div>
    
    </section>
  );
}
