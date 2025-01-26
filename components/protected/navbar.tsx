'use client';

import Link from 'next/link';
import { Menu, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserButton } from '@/components/auth/user-button';
import Logo from '../Logo';
import { ModeToggle } from '../mode-toggle';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className='w-full h-20 border-b flex items-center px-4'>
      <div className='md:hidden mr-2'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='icon'>
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56' align='end'>
            <DropdownMenuItem className='cursor-pointer' asChild>
              <Link href='/recorder'>Recorder</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer' asChild>
              <Link href='/organisation'>Organisation</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer' asChild>
              <Link href='/settings'>Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href='/server' className='flex items-center mr-8'>
        <Logo />
      </Link>

      <div className='hidden md:flex items-center space-x-6'>
      <Link
          href='/recorder'
          className={cn(
            'text-sm font-semibold transition-colors hover:text-primary',
            pathname !== '/recorder' && 'text-muted-foreground'
          )}
        >
          Recorder
        </Link>
      <Link
          href='/organisation'
          className={cn(
            'text-sm font-semibold transition-colors hover:text-primary',
            pathname !== '/organisation' && 'text-muted-foreground'
          )}
        >
          Organisation
        </Link>
   
        <Link
          href='/settings'
          className={cn(
            'text-sm font-semibold transition-colors hover:text-primary',
            pathname !== '/settings' && 'text-muted-foreground'
          )}
        >
          Settings
        </Link>
      </div>

      <div className='ml-auto flex items-center space-x-4'>
        <ModeToggle/>
        <UserButton />
      </div>
    </nav>
  );
}
