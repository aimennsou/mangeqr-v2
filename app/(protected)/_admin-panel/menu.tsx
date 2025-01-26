"use client";
import Link from "next/link";
import {  Loader2, LogOut, QrCode } from "lucide-react";
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
import Logo from "@/components/Logo";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { SignOutButton } from "@/components/auth/sign-out-button";





interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const router = useRouter();
  
  const pathname = usePathname();
  const menuList = getMenuList(pathname);
  const onSignOut = async () => {
    try {
      setIsSubmitting(true)
     
      setTimeout(() => {
        setIsSubmitting(false)
      }, 4000);
     
      router.push('/');

    } catch (error) {
      console.error('Error signing out:', error);
    
    }
  };
  return (



    <><Link href="/dashboard" className="flex mx-auto justify-center items-center gap-2">
      {isOpen ? (
        <Logo className="" />
      ) : (
        <QrCode className="h-6 w-6 text-primary" />
      )}
    </Link><ScrollArea className="[&>div>div[style]]:!block">




        <nav className="mt-8 h-full w-full">

          <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
            {menuList.map(({ groupLabel, menus }, index) => (
              <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
                {(isOpen && groupLabel) || isOpen === undefined ? (
                  <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                    {groupLabel}
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
                        <p>{groupLabel}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <p className="pb-2"></p>
                )}
                {menus.map(
                  ({ href, label, icon: Icon, active, submenus }, index) => submenus.length === 0 ? (
                    <div className="w-full" key={index}>
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
                                  {label}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={active}
                        submenus={submenus}
                        isOpen={isOpen} />
                    </div>
                  )
                )}
              </li>
            ))}

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
