import { Safari } from "@/components/safari";
import Image from "next/image";
import { Iphone15Pro } from "./iphone";



export default function PreviewLanding() {
  return (
    <div className="m-auto   ">

     <Safari
                           url="artisto.mangeqr.com"
                           className="size-full"
                           src=""
                        />
               <section className='hidden items-center justify-center sm:flex flex-col pt-8 lg:flex-row gap-12 lg:gap-16 items-center my-32'>
          <div className='flex-1 text-center max-w-sm lg:text-left'>
          <h3 className="text-xl text-center font-bold">
  Testez ce menu en réel
</h3>
<p className="text-center text-zinc-500">
  Découvrez un menu numérique intuitif et facile à utiliser, simple à modifier et entièrement personnalisé pour votre restaurant.
</p>
<Image 
  src="/images/arrow.png"
  alt="Feature Image"
  width={300}
  height={300}
  className="object-cover ml-auto hidden lg:block dark:invert"
/>

          </div>
       




       
          <Iphone15Pro
                 className=""
                 iframe="https://mangeqr.com/artisto"
              />
     
         
     
        </section>
   
    
    </div>
  );
}
