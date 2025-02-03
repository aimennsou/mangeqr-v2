
import { UserButton } from "@/components/auth/user-button";
import { ModeToggle } from "@/components/mode-toggle";
import { SheetMenu } from "./sheet-menu";



interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0   z-40 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 gap-2 flex h-14 items-center">
 
      <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          {/* <h1 className="font-bold">{title}</h1>         <UserNav/>*/}
        </div>


       


        <div className="flex flex-1 items-center space-x-2 justify-end">
        <ModeToggle />
   <UserButton />
        </div> 
      </div>
    </header>
  );
}



