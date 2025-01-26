'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { FaGitlab } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';

export function Social() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const onClick = (provider: 'google' |'linkedin' | 'github'| 'gitlab' ) => {
    signIn(provider, {
      callbackUrl: callbackUrl || DEFAULT_SIGNIN_REDIRECT
    });
  };

  return (
    <div className='w-full flex flex-col'>
    <div className='mt-1 mb-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-accent/50 dark:before:border-accent/50 after:mt-0.5 after:flex-1 after:border-t after:border-accent/50 dark:after:border-accent/50'>
      <p className='mx-4 mb-0 text-center font-medium text-muted-foreground'>
       Ou
      </p>
    </div>
    <div className='flex flex-col items-center w-full gap-2'>
      <Button
        size='lg'
        className='w-full px-0'
        variant='outline'
        disabled={loadingGoogle}
        onClick={() => {
          setLoadingGoogle(true);
          onClick('google');
        }}
      >
        {loadingGoogle && <Loader2 className='animate-spin mr-2' size={18} />}
        <FcGoogle className='h-5 w-5 mr-2' />
        <span className='text-xs'>Continuer avec google</span>
      </Button>
  

    </div>
  </div>
  
  );
}
