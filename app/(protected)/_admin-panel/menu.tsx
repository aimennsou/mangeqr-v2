"use client";
import Link from "next/link";
import {  Loader2, LogOut } from "lucide-react";
import {  useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "./collapse-menu-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";


import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Logo from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useWorkspaceRole, useAppRole, useOrderingEnabled } from "@/hooks/use-workspace-role";





interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const router = useRouter();
  
  const pathname = usePathname();
  // Hide owner-only entries from workspace MEMBERS (mangeqr-team, T9).
  const workspaceRole = useWorkspaceRole();
  // Show the SUPERADMIN-only "Super Admin" entry based on the app role (S6).
  const appRole = useAppRole();
  // Show ordering entries only when the account is ordering-enabled (FEAT-1).
  const orderingEnabled = useOrderingEnabled();
  const menuList = getMenuList(pathname, workspaceRole, appRole, orderingEnabled);
  const { t } = useI18n();

  // Translate a nav key, falling back to the (French) literal label.
  const tr = (key: string | undefined, fallback: string) =>
    key ? t(key as TranslationKey) : fallback;

  // Stable data-tour anchors for the guided tour (FEAT-1), keyed by nav href.
  const tourAnchorFor = (href: string): string | undefined => {
    if (href.includes("/restaurant")) return "nav-restaurants";
    if (href.includes("/categories")) return "nav-categories";
    if (href.includes("/menu")) return "nav-menus";
    if (href.includes("/numerique")) return "nav-numerique";
    return undefined;
  };

  return (



    <><Link href="/performances" className="flex mx-auto justify-center items-center gap-2">
      {isOpen ? (
        <Logo className="" />
      ) : (
        <Image
          src="/android-chrome-192x192.png"
          alt="MangeQR"
          width={28}
          height={28}
          className="h-7 w-7 rounded-md"
        />
      )}
    </Link><ScrollArea className="[&>div>div[style]]:!block">




        <nav data-tour="nav" className="mt-8 h-full w-full">

          <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
            {menuList.map(({ groupLabel, groupLabelKey, menus }, index) => {
              const groupLabelText = tr(groupLabelKey, groupLabel);
              return (
              <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
                {(isOpen && groupLabel) || isOpen === undefined ? (
                  <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                    {groupLabelText}
                  </p>
                ) : !isOpen && isOpen !== undefined && groupLabel ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger className="w-full">
                        <div className="w-full flex justify-center items-center">
                          <DotsHorizontalIcon className="h-5 w-5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{groupLabelText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <p className="pb-2"></p>
                )}
                {menus.map(
                  ({ href, label, labelKey, icon: Icon, active, submenus }, index) => {
                  const labelText = tr(labelKey, label);
                  const tourAnchor = tourAnchorFor(href);
                  return submenus.length === 0 ? (
                    <div className="w-full" key={index} data-tour={tourAnchor}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              className="w-full justify-start h-10 mb-1"
                              asChild
                            >
                              <Link href={href}>
                                <span
                                  className={cn(isOpen === false ? "" : "mr-4")}
                                >
                                  <Icon size={18} />
                                </span>
                                <p
                                  className={cn(
                                    "max-w-[200px] truncate",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100"
                                  )}
                                >
                                  {labelText}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {labelText}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={labelText}
                        active={active}
                        submenus={submenus}
                        isOpen={isOpen} />
                    </div>
                  );
                }
                )}
              </li>
              );
            })}

          </ul>
        </nav>
      </ScrollArea>
      
      
      <li className="w-full grow flex items-end">
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>

  
       


            </TooltipTrigger>
            {isOpen === false && (
              <TooltipContent side="right">Deconnecter</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </li></>
  );
}
