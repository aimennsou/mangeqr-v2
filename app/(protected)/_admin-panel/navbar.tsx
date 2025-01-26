
import { UserButton } from "@/components/auth/user-button";
import { ModeToggle } from "@/components/mode-toggle";



interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0   z-40 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 gap-2 flex h-14 items-center">
 
        <div className="flex flex-1 items-center space-x-2 justify-end">
        <ModeToggle />
   <UserButton />
        </div> 
      </div>
    </header>
  );
}



