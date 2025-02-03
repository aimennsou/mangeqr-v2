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


  return (
    <nav className='w-full h-20 border-b flex items-center px-4'>


      <div className='ml-auto flex items-center space-x-4'>
        <ModeToggle/>
        <UserButton />
      </div>
    </nav>
  );
}
