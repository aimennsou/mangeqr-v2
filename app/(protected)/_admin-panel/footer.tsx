import { ExclamationTriangleIcon } from "@radix-ui/react-icons";


export function Footer() {
  return (
    <div className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 md:mx-8 flex flex-row h-14 items-center">
      <ExclamationTriangleIcon className="text-yellow-400 mr-4" /> 
        <p className="flex text-xs md:text-sm leading-loose text-muted-foreground text-left">
           Support technique ou question ? merci d'appeler le {" "}
        <p className="mx-1 font-medium underline underline-offset-4">
            0752052024
          </p>
          </p>
    
      </div>
    </div>
  );
}
