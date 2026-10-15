import { MenuIcon, PanelsTopLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "./menu";

export function SheetMenu() {
  return (
    <Sheet>
      {/* `data-tour="mobile-menu-trigger"` lets the guided tour (BUG-4) open the
          mobile navigation Sheet programmatically before anchoring its steps to
          the nav items that only exist inside the Sheet on small screens. */}
      <SheetTrigger className="lg:hidden" asChild>
        <Button
          className="h-8"
          variant="outline"
          size="icon"
          data-tour="mobile-menu-trigger"
        >
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>
      {/* Mark the sheet content so the tour can scope its anchor lookups to the
          visible mobile menu (avoids matching the hidden desktop sidebar). */}
      <SheetContent
        className="sm:w-72 px-3 h-full flex flex-col"
        side="left"
        data-tour-mobile-menu
      >
        <SheetHeader>
          <Button
            className="flex justify-center items-center m-4"
            variant="link"
            asChild
          >
        <MenuIcon size={20} />
          </Button>
        </SheetHeader>
        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
}
