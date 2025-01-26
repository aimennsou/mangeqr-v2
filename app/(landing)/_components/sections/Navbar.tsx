'use client'
import Logo from "@/components/Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { ExpandingDotButton } from "@/components/ui/expandingbutton";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { FaChrome, FaFacebook, FaGoogle, FaYoutube } from "react-icons/fa";




export const Navbar = () => {
  const user = useCurrentUser();

  const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors  hover:text-primary focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm  leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-400">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

const components: { title: string; href: string; description: string }[] = [
  {
    title: "1. Créez votre compte",
    href: "/auth/sign-up",
    description: "Inscrivez-vous et créez votre compte personnalisé en quelques clics.",
  },
  {
    title: "2. Créez votre premier restaurant",
    href: "/auth/sign-up",
    description: "Ajoutez les détails de votre restaurant.",
  },
  {
    title: "3. Ajoutez vos menus",
    href: "/auth/sign-up",
    description: "Créez et gérez les menus de votre restaurant facilement.",
  },
  {
    title: "4. Imprimez ou commandez votre QR code personnalisé",
    href: "/auth/sign-up",
    description: "Obtenez votre QR code personnalisé.",
  },
  {
    title: "5. Modifiez vos menus et gérez vos plats",
    href: "/auth/sign-up",
    description: "Mettez à jour vos menus en ajoutant ou en supprimant des plats selon vos besoins.",
  },
  {
    title: "6. Visualisez vos performances",
    href: "/auth/sign-up",
    description: "Consultez les données de votre restaurant dans votre tableau de bord pour suivre vos performances.",
  },
];


  return (
    <header >

      <div
        className="fixed inset-x-0 top-0 z-50 h-22 backdrop-blur duration-200 $bg-zinc-900/500 "
      
      >
        
        
        <div className="mx-auto flex w-screen max-w-11xl items-center justify-between p-5 px-4 sm:px-6 lg:px-8">
          
          <div className="flex justify-between gap-4">
         
            <Logo className="max-md:hidden" />
            <div className="flex items-center justify-center gap-4 max-md:hidden">
            <ul className="hidden lg:flex items-center gap-2">


<NavigationMenu>
<NavigationMenuList>
<NavigationMenuItem>
    <NavigationMenuTrigger className="">Produits</NavigationMenuTrigger>
    <NavigationMenuContent>
      <ul className="grid  gap-6 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
        <li className="row-span-3">
          <NavigationMenuLink asChild>
            <a
              className="flex h-full w-full justify-between select-none flex-col rounded-md border border-bg-accent bg-accent/50 from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
              href="/"
            >
             
              <div className="mb-2 mt-4 text-lg font-medium">
              <Logo className="max-md:hidden" />
                                  </div>
              <p className="text-sm leading-tight text-foreground">
                On est axés sur trois gamme principales.
              </p>
            </a>



          </NavigationMenuLink>
        </li>
        <ListItem href="/auth/sign-up" title="Menu 100% numérique en code QR">
         Votre menu numérique a ajouté comme lien sur vos réseaux ou comme code QR dans votre restaurant avec synchronisation instantanée de vos modifications
        </ListItem>
        <ListItem href="/auth/sign-up" title="Systeme de capture d'avis client">
          Demandé a vos clients de vous données des avis positives directement via votre menu, notre systeme garde que les avis positifs
        </ListItem>
        <ListItem href="/auth/sign-up" title="Visualisation de vos performances">
            Un tableau de bord avec les statistiques de votre restaurant
        </ListItem>
      </ul>
    </NavigationMenuContent>
  </NavigationMenuItem>
  <NavigationMenuItem>
    <NavigationMenuTrigger className="">Solutions</NavigationMenuTrigger>
    <NavigationMenuContent>
      <ul className="grid  gap-6 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
        <li className="row-span-3">
        <NavigationMenuLink asChild>
            <a
              className="flex h-full w-full justify-between select-none flex-col rounded-md border border-bg-accent bg-accent/50 from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
              href="/"
            >
             
              <div className="mb-2 mt-4 text-lg font-medium">
              <Logo className="max-md:hidden" />
              </div>
              <p className="text-sm leading-tight text-foreground">
                On vous apporte 3 solutions pour améliorer votre activité.
              </p>
            </a>
          </NavigationMenuLink>
        </li>
        <ListItem href="/auth/sign-up" title="Reduire vos dépenses">
          Sur les réimpressions de menu apres chaque changement de prix ou plats
        </ListItem>
        <ListItem href="/auth/sign-up" title="Simplifier vos modifications">
         Menu synchronisé 24h/24 7j/7 en quelques clics
        </ListItem>
        <ListItem href="/auth/sign-up" title="Moderniser votre activité et impressionné votre clientel">
          Améliorer l'experience et satisfaction clients
        </ListItem>
      </ul>
    </NavigationMenuContent>
  </NavigationMenuItem>


  <NavigationMenuItem>
    <NavigationMenuTrigger className="">Guide</NavigationMenuTrigger>
    <NavigationMenuContent>
      <ul className="grid w-[400px] gap-6 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
        {components.map((component) => (
          <ListItem
            key={component.title}
            title={component.title}
            href={component.href}
          >
            {component.description}
          </ListItem>
        ))}
      </ul>
    </NavigationMenuContent>
  </NavigationMenuItem>

  
</NavigationMenuList>
</NavigationMenu>
<Link href={"/pricing"}>
<Button variant={"ghost"}>
Tarifs
  
</Button>
</Link>
      
</ul>
   

            </div>
          </div>
          <div className="flex items-center justify-end   gap-4 max-md:w-full">



            <div className='flex items-center '>
            {user ? (
                // Render "Go to Account" if user exists
                <Link href="/recorder">
                  <ExpandingDotButton size="lg" className="text-black cursor-pointer">
                   Mon compte
              </ExpandingDotButton>
                </Link>
              ) : (
                // Render "Sign in" and "Sign up" if no user
                <>
                  <Link href="/auth/sign-in">
                    <Button variant={"ghost"} size="lg" className="items-center mr-5 justify-center">Se connecter</Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <ExpandingDotButton size="lg" className="text-black cursor-pointer">
                      Créer un compte
                    </ExpandingDotButton>
                  </Link>
                </>
              )}
         

    
            </div>

            <Link href={"facebook"}>
                <Button variant="ghost" size="icon">
                <FaFacebook/>
                </Button>
              </Link>
              <Link href={"facebook"}>
                              <Button variant="ghost" size="icon">
                 <FaYoutube/>
                </Button>
              </Link>
     
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
