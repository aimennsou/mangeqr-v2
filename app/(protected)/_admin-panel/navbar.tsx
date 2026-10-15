import { SheetMenu } from "./sheet-menu";
import { NavbarActions } from "./navbar-actions";
import { PAGE_CONTAINER } from "./page-container";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-secondary">
      {/* Same column as the page body (PAGE_CONTAINER) so the menu button and
          the navbar actions line up with the content underneath instead of
          hugging the window edge on wide screens. The header background stays
          full-bleed — only its contents are constrained. */}
      <div className={`${PAGE_CONTAINER} flex h-14 items-center gap-2`}>
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          {/* <h1 className="font-bold">{title}</h1>         <UserNav/>*/}
        </div>

        <NavbarActions />
      </div>
    </header>
  );
}

